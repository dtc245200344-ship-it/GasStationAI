import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Tải các biến môi trường từ file .env
load_dotenv()

# Lấy API Key từ biến môi trường
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Khởi tạo client của thư viện google-genai
client = None
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)

# Định nghĩa System Prompt riêng biệt theo yêu cầu của rubric
SYSTEM_PROMPT = """Bạn là trợ lý quản lý trạm xăng thông minh. 
Nhiệm vụ của bạn là phân tích số liệu bán hàng, nhập hàng và tồn kho của một ca làm việc.
Bạn sẽ nhận được "theoretical_end_volume" (Tồn lý thuyết = Tồn đầu + Nhập - Bán) và "actual_end_volume" (Tồn thực tế đo được).
Hãy tính toán: Chênh lệch = Tồn thực tế - Tồn lý thuyết. 
Nếu Chênh lệch khác 0, BẮT BUỘC phải đưa vào danh sách abnormalities_detected để cảnh báo!
Chỉ phân tích số liệu được cung cấp, tuyệt đối không tự tạo thêm doanh thu, sản lượng hay thông tin không có thực.
Hãy trả về kết quả dưới định dạng JSON với cấu trúc sau:
{
    "shift_summary": "Tóm tắt ngắn gọn tình hình ca làm việc",
    "inventory_analysis": "Phân tích biến động tồn bồn và ghi rõ số chênh lệch giữa thực tế và lý thuyết",
    "abnormalities_detected": ["Danh sách các điểm bất thường, ví dụ: ⚠️ Phát hiện chênh lệch -80 L. Cần kiểm tra lại..."]
}
"""

CHATBOT_SYSTEM_PROMPT = """Bạn là trợ lý ảo AI thông minh của Trạm Xăng (GasStation AI).
Nhiệm vụ của bạn là trả lời các câu hỏi của nhân viên hoặc quản lý trạm xăng.
Bạn sẽ được cung cấp "Ngữ cảnh hiện tại" (Current Context) bao gồm thông tin về tồn kho, mặt hàng và ca làm việc.
Dựa vào ngữ cảnh đó, hãy trả lời câu hỏi của người dùng một cách ngắn gọn, súc tích và thân thiện.
Nếu người dùng hỏi những thông tin ngoài ngữ cảnh được cung cấp (ví dụ: ngày giờ, thời tiết, kiến thức chung), bạn vẫn có thể trả lời bình thường bằng kiến thức của mình, nhưng ưu tiên nghiệp vụ trạm xăng.
Tuyệt đối KHÔNG ĐƯỢC bịa đặt số liệu tồn kho. Nếu không có số liệu, hãy nói là không biết."""

def generate_shift_report(shift_data: dict):
    """
    Hàm nhận dữ liệu ca làm việc và gọi Gemini API để sinh báo cáo.
    
    Args:
        shift_data (dict): Dữ liệu ca bao gồm sales, tank_inventories, imports_during_shift.
    
    Returns:
        dict: Kết quả JSON từ AI bao gồm shift_summary, inventory_analysis, abnormalities_detected.
    """
    # Kiểm tra API Key đã được cấu hình chưa
    if not GEMINI_API_KEY or client is None:
        raise ValueError("GEMINI_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env.")

    # Xây dựng User Prompt từ dữ liệu ca
    user_prompt = (
        f"Dữ liệu ca bán hàng và tồn kho:\n"
        f"{json.dumps(shift_data, ensure_ascii=False, indent=2, default=str)}\n\n"
        f"Hãy sinh báo cáo ca và liệt kê số liệu cần kiểm tra theo định dạng JSON được yêu cầu."
    )

    try:
        # Gọi Gemini API với thư viện mới (google-genai)
        response = client.models.generate_content(
            model='gemini-1.5-flash',  # Model nhanh và miễn phí
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,       # Truyền System Prompt riêng
                response_mime_type="application/json",  # Ép AI trả về JSON chuẩn (không cần xóa markdown)
                temperature=0.2,                        # Giảm độ sáng tạo để AI bám sát số liệu thực tế
            )
        )
        
        # Lấy text trả về và parse thành dict
        text = response.text
        return json.loads(text)
        
    except Exception as e:
        error_str = str(e)
        # Nếu bị lỗi API (429, 503, v.v.), trả về dữ liệu mẫu (Mock Data) để không làm gián đoạn đồ án
        print(f"AI Error ({error_str}), returning Mock Data...")
        return {
            "shift_summary": "[Mô phỏng] Ca làm việc diễn ra ổn định. Các giao dịch bán hàng chủ yếu tập trung vào mặt hàng RON 95-III và E5 RON 92-II. Doanh thu tổng kết ca đạt mức kỳ vọng.",
            "inventory_analysis": "[Mô phỏng] Chi tiết tồn bồn:\n- Bồn 1 (RON 95-III): Đầu ca 5,000L, Bán ra 1,500L, Nhập 2,000L, Tồn lý thuyết 5,500L. Tồn thực tế: 5,420L (Chênh lệch: -80L).\n- Bồn 2 (E5 RON 92-II): Đầu ca 3,000L, Bán ra 85L, Nhập 0L, Cuối ca 2,915L (Khớp 100%).",
            "abnormalities_detected": [
                "[Mô phỏng] ⚠️ Phát hiện chênh lệch -80 L tại Bồn 1. Cần kiểm tra lại dữ liệu xuất bán và số liệu đo bồn.",
                "[Mô phỏng] Tốc độ bán hàng E5 RON 92-II chậm hơn 20% so với trung bình các ca trước."
            ]
        }

def generate_chat_response(db_context: dict, user_message: str):
    """
    Hàm gọi Gemini API để chat với người dùng, có truyền ngữ cảnh từ DB.
    """
    if not GEMINI_API_KEY or client is None:
        raise ValueError("GEMINI_API_KEY chưa được cấu hình. Vui lòng thêm vào file .env.")

    user_prompt = (
        f"--- NGỮ CẢNH HIỆN TẠI TỪ CƠ SỞ DỮ LIỆU ---\n"
        f"{json.dumps(db_context, ensure_ascii=False, indent=2, default=str)}\n"
        f"--------------------------------------------\n\n"
        f"Câu hỏi của người dùng: {user_message}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=CHATBOT_SYSTEM_PROMPT,
                temperature=0.7,
            )
        )
        return response.text
    except Exception as e:
        print(f"Chatbot AI Error ({str(e)}), returning Mock Data...")
        
        # Fallback rule-based responses if API Key is invalid
        msg = user_message.lower()
        if "nhân viên" in msg or "ca" in msg or "trực" in msg or "làm việc" in msg:
            active_emps = db_context.get("active_employees", [])
            if not active_emps:
                return "Hiện tại không có nhân viên nào đang trong ca trực."
            
            emp_list = []
            for emp in active_emps:
                emp_list.append(f"{emp['username']} (Mã ca: {emp['shift_id']})")
            return f"Hiện tại hệ thống ghi nhận có {len(active_emps)} nhân viên đang trong ca làm việc:\n" + "\n".join(emp_list)
            
        if "doanh thu" in msg or "doan thu" in msg or "doanh" in msg or "bán" in msg or "tiền" in msg or "ban" in msg or "tien" in msg:
            stats = db_context.get("today_stats", {})
            return f"Doanh thu hôm nay đạt {stats.get('revenue_today', 0):,.0f} VNĐ, với tổng sản lượng bán ra là {stats.get('volume_sold_today', 0):,.0f} Lít."
            
        if "tồn kho" in msg or "bồn" in msg or "xăng" in msg or "ton kho" in msg or "bon" in msg or "xang" in msg:
            tanks = db_context.get("tanks", [])
            tank_info = "\n".join([f"- Bồn {t['name']}: {t['current_volume']:,.0f}/{t['capacity']:,.0f} Lít" for t in tanks])
            return f"Tình hình tồn kho hiện tại:\n{tank_info}"
            
        if "bất thường" in msg or "cảnh báo" in msg or "lỗi" in msg or "bat thuong" in msg or "canh bao" in msg or "loi" in msg:
            stats = db_context.get("today_stats", {})
            alerts = stats.get("alerts", [])
            if not alerts:
                return "Hệ thống hiện tại hoạt động bình thường, không ghi nhận cảnh báo hay bất thường nào."
            else:
                alert_list = "\n".join([f"- {a}" for a in alerts])
                return f"Hệ thống ghi nhận có {len(alerts)} cảnh báo bất thường/an toàn:\n{alert_list}"
                
        if "an toàn" in msg or "nguy hiểm" in msg or "cháy" in msg or "nhiệt độ" in msg or "an toan" in msg or "nguy hiem" in msg or "chay" in msg or "nhiet do" in msg:
            stats = db_context.get("today_stats", {})
            alerts = stats.get("alerts", [])
            safety_alerts = [a for a in alerts if "AN TOÀN" in a or "KHẨN CẤP" in a]
            if safety_alerts:
                return "⚠️ HỆ THỐNG PHÁT HIỆN TÌNH HUỐNG NGUY HIỂM:\n" + "\n".join([f"- {a}" for a in safety_alerts])
            return "✅ Hiện tại hệ thống cảm biến (nhiệt độ, khói nồng độ xăng) báo cáo các chỉ số an toàn đều trong ngưỡng cho phép. Không phát hiện tình huống nguy hiểm."
                
        return "Xin lỗi, do lỗi API Key nên tôi chỉ có thể trả lời các câu hỏi cơ bản về: Nhân viên đang trực, Doanh thu hôm nay, Tình hình tồn kho, hoặc An toàn/Cảnh báo."