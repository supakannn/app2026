// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration (เอามาจากข้อมูลของคุณ)
const firebaseConfig = {
  apiKey: "AIzaSyDxvOSd5EJV_f7aqRxADsoguitfrL4OvSk",
  authDomain: "supakan-96b00.firebaseapp.com",
  projectId: "supakan-96b00",
  storageBucket: "supakan-96b00.firebasestorage.app",
  messagingSenderId: "435040293789",
  appId: "1:435040293789:web:e2af362b4bd6e15e40d574",
  measurementId: "G-11X3PR89EV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const partiesCol = collection(db, "parties"); // Collection ชื่อ parties

// DOM Elements
const partyList = document.getElementById("partyList");
const fabBtn = document.getElementById("fabBtn");
const partyModal = document.getElementById("partyModal");
const closeModal = document.getElementById("closeModal");
const partyForm = document.getElementById("partyForm");

// 1. ระบบเปิด/ปิด Modal (ฟอร์มตั้งตี้)
fabBtn.addEventListener("click", () => {
    partyModal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
    partyModal.style.display = "none";
});

// ปิด Modal เมื่อคลิกพื้นที่ว่างสีดำ
window.addEventListener("click", (e) => {
    if (e.target === partyModal) {
        partyModal.style.display = "none";
    }
});

// 2. ดึงข้อมูลจาก Firestore แบบ Realtime (เรียงจากใหม่ไปเก่า)
const q = query(partiesCol, orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    partyList.innerHTML = ""; // ล้างหน้าจอเก่าออก
    
    if (snapshot.empty) {
        partyList.innerHTML = "<div class='loading'>ยังไม่มีตี้เปิดเลย... มาเป็นคนแรกสิ!</div>";
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        // สร้างการ์ดตี้
        const card = document.createElement("div");
        card.className = "party-card";
        card.innerHTML = `
            <div class="party-header">
                <div class="party-title">${data.activity_name}</div>
                <div class="badge">ขาด ${data.missing_people} คน</div>
            </div>
            <div class="contact-box">
                <span>ติดต่อจอยตี้ 👇</span>
                <strong>Line: ${data.contact_info}</strong>
            </div>
        `;
        partyList.appendChild(card);
    });
});

// 3. บันทึกข้อมูลตี้ใหม่
partyForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // ดึงค่าจากฟอร์ม
    const activityName = document.getElementById("activityName").value;
    const missingPeople = parseInt(document.getElementById("missingPeople").value);
    const contactInfo = document.getElementById("contactInfo").value;

    // ปุ่ม Submit แสดงสถานะกำลังโหลด (UX ที่ดี)
    const submitBtn = partyForm.querySelector('.btn-submit');
    submitBtn.textContent = "กำลังเปิดตี้...";
    submitBtn.disabled = true;

    try {
        await addDoc(partiesCol, {
            activity_name: activityName,
            missing_people: missingPeople,
            contact_info: contactInfo,
            createdAt: serverTimestamp() // บันทึกเวลาจาก Server
        });
        
        // รีเซ็ตฟอร์มและปิด Modal
        partyForm.reset();
        partyModal.style.display = "none";
        alert("เปิดตี้สำเร็จ! รอมิตรสหายทักไปได้เลย 🎉");
        
    } catch (error) {
        console.error("Error adding document: ", error);
        
        // หมายเหตุ: หากติด Error สิทธิ์การเข้าถึง (Permission Denied) 
        // ต้องไปปรับ Firebase Firestore Rules ให้เป็น allow read, write: if true; ชั่วคราวครับ
        alert("เกิดข้อผิดพลาด ลองเช็คสิทธิ์ (Rules) ใน Firebase ดูนะครับ");
    } finally {
        submitBtn.textContent = "เปิดตี้เลย!";
        submitBtn.disabled = false;
    }
});
