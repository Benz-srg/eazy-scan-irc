import type {
  Analysis,
  Feature,
  MandayRow,
  Risk,
  Missing,
  Dependency,
  Integration,
  Summary,
  HistoryItem,
} from "./types";

export const PROJECT = {
  client: "บริษัท ตราดี รีเทล กรุ๊ป",
  title: "แพลตฟอร์มบริหารธุรกิจ E-Commerce & คลังสินค้า",
  audioName: "Requirement_TradeeRetail_call.m4a",
  duration: "12:47",
  date: "2 มิ.ย. 2568",
  confidence: 92,
  mandayMin: 63,
  mandayMax: 82,
};

export const TRANSCRIPT = `ลูกค้า: คือตอนนี้ร้านเราโตเร็วมากครับ มีหน้าร้านสามสาขาแล้วก็ขายออนไลน์ด้วย ปัญหาคือสต็อกมันไม่ตรงกัน ของในเว็บบอกมีแต่จริง ๆ หมด ลูกค้าสั่งแล้วต้องมายกเลิก เสียความรู้สึกมาก

ทีมงาน: เข้าใจครับ แล้วตอนนี้ใช้ระบบอะไรอยู่บ้างครับ

ลูกค้า: ใช้ Excel กับ LINE คุยกันเอง พนักงานหลายคนเลยงงว่าใครแก้ตัวไหน อยากได้ระบบที่จัดการสินค้า สต็อก แล้วก็ออเดอร์รวมศูนย์ที่เดียว มีหน้า Dashboard ดูยอดขายได้ แล้วก็อยากให้แจ้งเตือนผ่าน LINE เวลามีออเดอร์เข้าหรือของใกล้หมด

ทีมงาน: เรื่องการเก็บเงินล่ะครับ

ลูกค้า: อยากรับบัตรเครดิตกับพร้อมเพย์ด้วย แล้วก็ถ้าเป็นไปได้อยากมี AI ช่วยวิเคราะห์ว่าควรสต็อกสินค้าตัวไหนเพิ่ม ช่วงไหนขายดี... งบประมาณยังไม่ฟิกซ์ แต่อยากใช้ได้จริงภายในไตรมาสนี้`;

export const SUMMARY: Summary = {
  overview:
    "ลูกค้าเป็นธุรกิจค้าปลีกที่กำลังเติบโต มีหน้าร้าน 3 สาขาและช่องทางขายออนไลน์ ต้องการแพลตฟอร์มบริหารธุรกิจแบบรวมศูนย์เพื่อแก้ปัญหาสต็อกไม่ตรงกันระหว่างช่องทาง จัดการออเดอร์ สินค้า และลูกค้าในที่เดียว พร้อมแดชบอร์ดวิเคราะห์ยอดขายและการแจ้งเตือนผ่าน LINE",
  goals: [
    "รวมสต็อกทุกช่องทางให้ตรงกันแบบเรียลไทม์",
    "บริหารออเดอร์และลูกค้าในระบบเดียว",
    "เห็นภาพรวมยอดขายผ่าน Dashboard",
    "พร้อมใช้งานจริงภายในไตรมาสนี้",
  ],
  scale: "SME · 3 สาขา + ออนไลน์",
  timeline: "≈ 3–4 เดือน (1 ทีม)",
};

export const FEATURES: Feature[] = [
  { name: "ระบบยืนยันตัวตนผู้ใช้", en: "User Authentication", icon: "shield-check", desc: "ลงทะเบียน เข้าสู่ระบบ และจัดการรหัสผ่านอย่างปลอดภัยด้วย JWT พร้อมรองรับ Social Login", est: "4–5 วัน", impact: "high" },
  { name: "จัดการบทบาทและสิทธิ์", en: "Role & Permission", icon: "users-round", desc: "กำหนดบทบาท (เจ้าของ / ผู้จัดการ / พนักงาน) และสิทธิ์การเข้าถึงแต่ละโมดูลแบบยืดหยุ่น", est: "3–4 วัน", impact: "high" },
  { name: "จัดการสินค้า", en: "Product Management", icon: "package", desc: "เพิ่ม/แก้ไขสินค้า หมวดหมู่ ราคา รูปภาพ และตัวเลือกสินค้า (SKU/Variant)", est: "5–6 วัน", impact: "high" },
  { name: "ติดตามสต็อกคลังสินค้า", en: "Inventory Tracking", icon: "layers", desc: "ตัดสต็อกอัตโนมัติแบบเรียลไทม์ทุกช่องทาง รองรับหลายสาขา และแจ้งเตือนของใกล้หมด", est: "8–10 วัน", impact: "high" },
  { name: "ใบสั่งซื้อและใบสั่งขาย", en: "Purchase & Sales Orders", icon: "receipt-text", desc: "จัดการ PO/SO สถานะการจัดส่ง และเอกสารที่เกี่ยวข้องครบวงจร", est: "10–12 วัน", impact: "high" },
  { name: "ระบบลูกค้าสัมพันธ์ (CRM)", en: "Customer Management", icon: "contact", desc: "ฐานข้อมูลลูกค้า ประวัติการซื้อ และการแบ่งกลุ่มลูกค้าเพื่อทำการตลาด", est: "5–7 วัน", impact: "medium" },
  { name: "แดชบอร์ดและการวิเคราะห์", en: "Dashboard & Analytics", icon: "chart-line", desc: "ภาพรวมยอดขาย สินค้าขายดี และรายงานแยกตามช่วงเวลา/สาขา", est: "8–10 วัน", impact: "medium" },
  { name: "แจ้งเตือนผ่าน LINE OA", en: "LINE OA Notifications", icon: "bell-ring", desc: "ส่งแจ้งเตือนออเดอร์ใหม่และสต็อกต่ำผ่าน LINE Messaging API", est: "3–4 วัน", impact: "medium" },
  { name: "เชื่อมต่อ Payment Gateway", en: "Payment Integration", icon: "credit-card", desc: "รองรับบัตรเครดิตและพร้อมเพย์ผ่านผู้ให้บริการ เช่น Omise หรือ 2C2P", est: "4–6 วัน", impact: "medium" },
  { name: "AI วิเคราะห์การขาย", en: "AI Sales Insights", icon: "sparkles", desc: "แนะนำสินค้าที่ควรสต็อกเพิ่มและคาดการณ์ช่วงขายดีจากข้อมูลในอดีต", est: "6–8 วัน", impact: "low" },
];

export const MANDAY: MandayRow[] = [
  { module: "ยืนยันตัวตน + สิทธิ์ผู้ใช้", min: 7, max: 9, note: "Auth, RBAC, Social login" },
  { module: "จัดการสินค้า", min: 5, max: 6, note: "CRUD, SKU/Variant, รูปภาพ" },
  { module: "ติดตามสต็อกคลังสินค้า", min: 8, max: 10, note: "Multi-branch, real-time sync" },
  { module: "ใบสั่งซื้อ/ใบสั่งขาย", min: 10, max: 12, note: "PO/SO, สถานะ, เอกสาร" },
  { module: "ระบบลูกค้าสัมพันธ์ (CRM)", min: 5, max: 7, note: "Profile, history, segment" },
  { module: "แดชบอร์ด & รายงาน", min: 8, max: 10, note: "Charts, filter, export" },
  { module: "แจ้งเตือน LINE OA", min: 3, max: 4, note: "Messaging API webhook" },
  { module: "Payment Gateway", min: 4, max: 6, note: "Omise/2C2P, พร้อมเพย์" },
  { module: "AI Sales Insights", min: 6, max: 8, note: "Model + แนะนำสต็อก" },
  { module: "ระบบหลังบ้าน / Infra / QA", min: 7, max: 10, note: "Setup, CI/CD, ทดสอบ" },
];

export const RISKS: Risk[] = [
  { title: "ความซับซ้อนของการ Sync สต็อกหลายช่องทาง", level: "สูง", desc: "การตัดสต็อกเรียลไทม์ระหว่างหน้าร้าน 3 สาขาและออนไลน์มีโอกาสเกิด race condition หากออกแบบไม่รัดกุม" },
  { title: "ขอบเขต AI Insights ยังไม่ชัดเจน", level: "กลาง", desc: "ความคาดหวังเรื่องความแม่นยำของการคาดการณ์ยอดขายอาจสูงเกินกว่าข้อมูลที่มีในช่วงเริ่มต้น" },
  { title: "งบประมาณยังไม่ฟิกซ์", level: "กลาง", desc: "ลูกค้ายังไม่ระบุงบ ทำให้ต้องยืนยัน scope ก่อนเริ่ม เพื่อไม่ให้บานปลาย" },
  { title: "ไทม์ไลน์ภายในไตรมาส", level: "กลาง", desc: "ขอบเขตงานเต็มรูปแบบอาจไม่ทันใน 1 ไตรมาส ควรพิจารณาทำ MVP ก่อน" },
];

export const ASSUMPTIONS: string[] = [
  "ใช้ผู้ให้บริการ Speech-to-Text และ LLM ภายนอกได้ (ไม่ต้อง on-premise)",
  "มีทีมพัฒนา 1 ทีม (Full-stack 2–3 คน) ทำงานเต็มเวลา",
  "ใช้ LINE Official Account ที่มีอยู่แล้วของลูกค้า",
  "การคิดเงินใช้ Payment Gateway สำเร็จรูป ไม่ต้องผ่าน PCI-DSS เอง",
  "ออกแบบ UI บนพื้นฐาน Web ก่อน แล้วทำ Mobile responsive",
];

export const MISSING: Missing[] = [
  { q: "งบประมาณโดยประมาณของโครงการคือเท่าไร?", why: "กำหนดขอบเขต MVP เทียบกับฟีเจอร์เต็ม" },
  { q: "มีสินค้าทั้งหมดกี่ SKU และมีตัวเลือก (variant) หรือไม่?", why: "ส่งผลต่อโครงสร้างข้อมูลและเวลาจัดการสินค้า" },
  { q: "ต้องการรองรับหลายสกุลเงิน/หลายภาษาหรือไม่?", why: "กระทบสถาปัตยกรรมตั้งแต่ต้น" },
  { q: "ระบบบัญชี/ERP เดิมที่ต้องเชื่อมต่อมีหรือไม่?", why: "อาจต้องทำ integration เพิ่ม" },
  { q: "ปริมาณออเดอร์ต่อวันสูงสุดที่คาดไว้?", why: "กำหนดการออกแบบ scale และ infra" },
];

export const QUESTIONS: string[] = [
  "ช่องทางขายออนไลน์ปัจจุบันคืออะไรบ้าง (เว็บของตัวเอง / Marketplace / Social)?",
  "ต้องการให้พนักงานแต่ละสาขาเห็นข้อมูลข้ามสาขาได้หรือไม่?",
  "มีรูปแบบโปรโมชัน/ส่วนลดที่ต้องรองรับในระบบหรือไม่?",
  "ต้องการออกใบกำกับภาษี/ใบเสร็จในระบบเลยหรือไม่?",
  "คาดหวังให้ AI Insights อัปเดตบ่อยแค่ไหน (รายวัน/รายสัปดาห์)?",
];

export const DEPENDENCIES: Dependency[] = [
  { name: "LINE Messaging API", note: "ต้องมี LINE OA + Channel access token", icon: "message-circle" },
  { name: "Payment Gateway (Omise / 2C2P)", note: "บัญชีผู้ค้าและการอนุมัติ KYC", icon: "credit-card" },
  { name: "Speech-to-Text Provider", note: "OpenAI Whisper หรือ self-host", icon: "mic" },
  { name: "Cloud Hosting + DB", note: "MongoDB Atlas / Vercel / Cloud Storage", icon: "cloud" },
];

export const INTEGRATIONS: Integration[] = [
  { name: "LINE OA", cat: "Notification", icon: "message-circle" },
  { name: "Omise", cat: "Payment", icon: "credit-card" },
  { name: "พร้อมเพย์", cat: "Payment", icon: "qr-code" },
  { name: "OpenAI", cat: "AI / STT", icon: "sparkles" },
  { name: "MongoDB", cat: "Database", icon: "database" },
  { name: "Cloud Storage", cat: "File", icon: "cloud" },
];

export const PROMPTS: Record<string, string> = {
  summary: `คุณคือ Senior Project Manager วิเคราะห์ transcript ต่อไปนี้ แล้วสรุปเป็น Executive Summary ภาษาไทย\nระบุ: บริบทธุรกิจ, เป้าหมายหลัก 3-4 ข้อ, ขนาดโครงการ\nตอบกลับเป็น JSON: { overview, goals[], scale, timeline }`,
  features: `สกัด Requirement จาก transcript ออกมาเป็นรายการฟีเจอร์ (features[])\nแต่ละฟีเจอร์ระบุ: name(ไทย), description, manday estimate (range), impact(high|medium|low)\nตอบกลับเป็น JSON array เท่านั้น`,
  manday: `ประเมิน Manday แยกตาม Module จากรายการฟีเจอร์\nแต่ละ module ให้ค่า min/max (วัน) และหมายเหตุสั้น ๆ\nรวมเวลา QA และ infra ด้วย ตอบกลับเป็น JSON: { breakdown[], total:{min,max} }`,
  missing: `จาก transcript ระบุข้อมูลที่ยังขาดและจำเป็นต่อการประเมิน\nแต่ละข้อระบุ: คำถาม, เหตุผลที่ต้องถาม\nตอบกลับเป็น JSON array`,
  questions: `สร้างรายการคำถามที่ควรถามลูกค้าเพิ่มเพื่อปิด gap ของ requirement\nเน้นคำถามที่ส่งผลต่อ scope และ estimate ตอบกลับเป็น JSON array`,
  risks: `วิเคราะห์ความเสี่ยงของโครงการจาก transcript และ scope\nแต่ละข้อระบุ: ความเสี่ยง, ระดับ(สูง|กลาง|ต่ำ), คำอธิบาย ตอบกลับเป็น JSON array`,
  assumptions: `ระบุสมมติฐานที่ใช้ในการประเมินโครงการนี้ ตอบกลับเป็น JSON array ของข้อความ`,
  dependencies: `ระบุ dependencies ภายนอกที่โครงการต้องพึ่งพา ตอบกลับเป็น JSON array { name, note }`,
  integrations: `ระบุระบบภายนอกที่ต้อง integrate พร้อมหมวดหมู่ ตอบกลับเป็น JSON array { name, category }`,
};

export const HISTORY_SEED: HistoryItem[] = [
  { id: "h1", title: "แพลตฟอร์มบริหารธุรกิจ E-Commerce & คลังสินค้า", client: "บริษัท ตราดี รีเทล กรุ๊ป", audio: "Requirement_TradeeRetail_call.m4a", date: "2 มิ.ย. 2568", mandayMin: 63, mandayMax: 82, features: 10, tag: "E-Commerce" },
  { id: "h2", title: "ระบบจองคิวคลินิกความงาม", client: "Glow Clinic", audio: "glow_brief_0529.mp3", date: "29 พ.ค. 2568", mandayMin: 28, mandayMax: 36, features: 6, tag: "Healthcare" },
  { id: "h3", title: "แอปสะสมแต้มร้านกาแฟ", client: "Bean & Co.", audio: "loyalty_meeting.wav", date: "24 พ.ค. 2568", mandayMin: 18, mandayMax: 24, features: 5, tag: "Loyalty" },
  { id: "h4", title: "ระบบจัดการคลังสินค้าโรงงาน", client: "Siam Pack Industry", audio: "wms_requirement.m4a", date: "18 พ.ค. 2568", mandayMin: 45, mandayMax: 58, features: 8, tag: "Logistics" },
  { id: "h5", title: "เว็บไซต์จองทัวร์ท่องเที่ยว", client: "Andaman Trips", audio: "tour_booking_call.mp3", date: "11 พ.ค. 2568", mandayMin: 32, mandayMax: 41, features: 7, tag: "Travel" },
];

/** The full analysis object the Results screen renders (sample fallback, no API needed). */
export const SAMPLE_ANALYSIS: Analysis = {
  client: PROJECT.client,
  title: PROJECT.title,
  confidence: PROJECT.confidence,
  evidence: TRANSCRIPT.split("\n\n")[0],
  mandayMin: PROJECT.mandayMin,
  mandayMax: PROJECT.mandayMax,
  summary: SUMMARY,
  features: FEATURES,
  manday: MANDAY,
  risks: RISKS,
  assumptions: ASSUMPTIONS,
  missing: MISSING,
  questions: QUESTIONS,
  dependencies: DEPENDENCIES,
  integrations: INTEGRATIONS,
};
