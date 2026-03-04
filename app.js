// Import Firebase SDKs (Modular Version)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Firebase Configuration ของคุณ
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
const expensesCol = collection(db, "expenses"); // สร้าง Collection ชื่อ expenses

// ตัวแปรเก็บข้อมูลฝั่ง Frontend
let expenseData = [];

// ดึง Elements จาก HTML
const form = document.getElementById("expenseForm");
const expenseList = document.getElementById("expenseList");
const totalAmountSpan = document.getElementById("totalAmount");
const calculateBtn = document.getElementById("calculateBtn");
const resultArea = document.getElementById("resultArea");
const resultList = document.getElementById("resultList");
const clearBtn = document.getElementById("clearBtn");

// 1. ดึงข้อมูลจาก Firestore แบบ Realtime
onSnapshot(expensesCol, (snapshot) => {
    expenseData = [];
    let total = 0;
    expenseList.innerHTML = "";

    snapshot.forEach((doc) => {
        const data = doc.data();
        expenseData.push({ id: doc.id, ...data });
        total += data.amount;

        // แสดงผลรายการ
        const li = document.createElement("li");
        li.innerHTML = `<span>${data.name}</span> <span>${data.amount.toLocaleString()} บาท</span>`;
        expenseList.appendChild(li);
    });

    totalAmountSpan.textContent = total.toLocaleString();
    resultArea.style.display = "none"; // ซ่อนผลลัพธ์ไปก่อนถ้ามีการอัปเดตข้อมูล
});

// 2. เพิ่มข้อมูลลง Firestore
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("name").value.trim();
    const amountInput = parseFloat(document.getElementById("amount").value);

    if (nameInput && amountInput >= 0) {
        try {
            await addDoc(expensesCol, {
                name: nameInput,
                amount: amountInput
            });
            form.reset();
        } catch (error) {
            console.error("Error adding document: ", error);
            alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    }
});

// 3. คำนวณการหารเงินอย่างลงตัว (Split Algorithm)
calculateBtn.addEventListener("click", () => {
    if (expenseData.length === 0) {
        alert("ยังไม่มีข้อมูลการจ่ายเงินครับ!");
        return;
    }

    // รวมเงินที่แต่ละคนจ่าย (กรณีชื่อเดียวกันจ่ายหลายรอบ)
    const personTotals = {};
    let grandTotal = 0;

    expenseData.forEach(item => {
        if (!personTotals[item.name]) personTotals[item.name] = 0;
        personTotals[item.name] += item.amount;
        grandTotal += item.amount;
    });

    const peopleCount = Object.keys(personTotals).length;
    const average = grandTotal / peopleCount; // ค่าเฉลี่ยที่ทุกคนต้องจ่าย

    const debtors = []; // คนที่ต้องจ่ายเพิ่ม (จ่ายไปน้อยกว่าค่าเฉลี่ย)
    const creditors = []; // คนที่ต้องได้เงินคืน (จ่ายไปมากกว่าค่าเฉลี่ย)

    for (const [name, paidAmount] of Object.entries(personTotals)) {
        const balance = paidAmount - average;
        if (balance < -0.01) {
            debtors.push({ name, amount: Math.abs(balance) });
        } else if (balance > 0.01) {
            creditors.push({ name, amount: balance });
        }
    }

    // จับคู่โอนเงิน
    resultList.innerHTML = "";
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];
        const transferAmount = Math.min(debtor.amount, creditor.amount);

        const li = document.createElement("li");
        li.textContent = `💸 ${debtor.name} ต้องโอนให้ ${creditor.name} จำนวน ${transferAmount.toFixed(2)} บาท`;
        resultList.appendChild(li);

        debtor.amount -= transferAmount;
        creditor.amount -= transferAmount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    // ถ้าทุกคนจ่ายเท่ากันหมด
    if (resultList.innerHTML === "") {
        const li = document.createElement("li");
        li.textContent = "🎉 ทุกคนจ่ายเท่ากันหมดแล้ว ไม่ต้องมีใครโอน!";
        resultList.appendChild(li);
    }

    resultArea.style.display = "block";
});

// 4. ล้างข้อมูล (เคลียร์ฐานข้อมูล)
clearBtn.addEventListener("click", async () => {
    if (confirm("คุณแน่ใจหรือไม่ว่าต้องการเคลียร์ข้อมูลวงตี้ทั้งหมด?")) {
        const querySnapshot = await getDocs(expensesCol);
        querySnapshot.forEach(async (document) => {
            await deleteDoc(doc(db, "expenses", document.id));
        });
        resultArea.style.display = "none";
    }
});
