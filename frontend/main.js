// const { $where } = require("../backend/models/User");

const API_BASE = "https://socialmediawebsite-production-9909.up.railway.app/api/";
// const API = "http://127.0.0.1:5000/api/";
// =========================
// ⏳ Time Ago Function
// =========================
function timeAgo(date) {
  const now = new Date();
  const postDate = new Date(date);

  const seconds = Math.floor((now - postDate) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

// 📥 Get Posts
// =========================
function getPosts() {
  axios.get(`${API_BASE}posts`)
    .then((res) => {
      const posts = res.data;
      let container = document.getElementById("postes");  
      let instructions = document.getElementById("instructions");
      if (!container) {
        console.log("container not found");
        return;
      }
      setTimeout(()=>{
        instructions.innerHTML = "";
      }, 15000)
      container.innerHTML = "";
      for (const post of posts) {        
        let content = `
          <div class="w-100 shadow">
            <div class="card w-100 my-5">
              <div class="card-body">
                <img class="rounded-circle" style="width:40px;height:40px"
                  src="${post.user.profileImage}">
                <h5 class="d-inline">@${post.user.name}</h5>
              </div>
              <div class="card-body">
                <img src="${post.image}" class="card-img-top" alt="Post image">
                <p class="text-black-50">
                  ${timeAgo(post.createdAt)}
                </p>
              </div>
              <div class="card-body py-0">
                <h5>${post.title}</h5>
                <p>${post.body}</p>
                <hr>
              </div>
            </div>
          </div>
        `;
        container.innerHTML += content;
      }
    })
    .catch((err) => {
      showAlert("❌ Error loading posts:" , "#FF0000");
    });
}
// =========================
// ➕ Create Post
// =========================
function createPost() {
    // جلب العناصر
    const titleInput = document.getElementById("title");
    const bodyInput = document.getElementById("body");
    
    // جلب القيم
    let title = titleInput.value;
    let body = bodyInput.value;
    
    // التحقق من وجود العناصر
    if (title === "" || body === "") {
      showAlert("Please fill in all fields." , "#FF0000");
      return;
    }
    // تجهيز البيانات
    const params = {
      "title" : title,
      "body" : body,
      "image": "https://picsum.photos/500/300?random=" + Date.now()
    }
    axios.post(`${API_BASE}posts`, params, {
      headers: {
        Authorization: `Bearer ${getToken()}`
      }
    })
    .then((res) => {
      titleInput.value = "";
      bodyInput.value = "";
      showAlert("Post created successfully!" , "#1B8C1C");
      // إغلاق المودال بأمان
      const modalElement = document.getElementById("staticBackdrop");
      const modalInstance = bootstrap.Modal.getInstance(modalElement);

      if (modalInstance) {
        modalInstance.hide();
      }
      // تحديث البوستات
      getPosts();
    })
    .catch((err) => {
      showAlert("❌ خطأ من السيرفر:" , "#FF0000");
      showAlert(`❌ ${err.message}` , "#FF0000");
    });
}
// =========================
// 🚀 Init
// =========================
getPosts();

// =========================
// 🔐 Login
// =========================
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const logoutBtn = document.getElementById("logout-btn");

  axios.post(`${API_BASE}login`, {
    email,
    password
  })
  .then(res => {
    const token = res.data.token;
    // حفظ التوكن
    localStorage.setItem("token", token);
    
    showAlert("Logged in successfully 🔥" , "#1B8C1C");
    logoutBtn.style.display = "block";
    // 🔥 قفل المودال هنا
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("loginModal")
    );
    modal.hide();
    updateUI();
  })
  .catch(err => {
    
    showAlert("Invalid email or password." , "#FF0000");
  });
}
function updateUI() {
  const logoutBtn = document.getElementById("logout-btn");
  const loginBtn = document.getElementById("login-btn");
  const registerBtn = document.getElementById("register-btn");
  const userNameSpan = document.getElementById("user-name-span");

  if (isLoggedIn()) {
    document.getElementById("createPostBtn").style.display = "block";
    logoutBtn.style.display = "block";
    loginBtn.style.display = "none";
    registerBtn.style.display = "none";
    // عرض اسم المستخدم في الواجهة
    const token = getToken();
    try {
      const base64 = token.split(".")[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );

      const payload = JSON.parse(jsonPayload);
      userNameSpan.textContent = payload.name +" 🔥" || "";
    } catch (err) {
      showAlert("Invalid token. Please log in again." , "#FF0000");
      userNameSpan.textContent = "";
    }

  } else {
    document.getElementById("createPostBtn").style.display = "none";
    logoutBtn.style.display = "none";
    loginBtn.style.display = "block";
    registerBtn.style.display = "block";
    userNameSpan.textContent = "";
  }
}
updateUI()
function getToken() {
  return localStorage.getItem("token");
}
// =========================
// ✅ Check if logged in
// =========================
function isLoggedIn() {
  return !!localStorage.getItem("token");
}

// =========================
// 🔒 Logout
// =========================
function logout() {
  localStorage.removeItem("token");
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("logoutModal")
  );
  modal.hide();
  showAlert("You have been logged out." , "#1B8C1C");
  updateUI();
}
// =========================
// 📝 Register
// =========================
function register() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email-register").value.trim();
  const password = document.getElementById("password-register").value.trim();

  axios.post(`${API_BASE}register`, {
    name,
    email,
    password
  })
  .then(() => {
      showAlert("Registered successfully! Please log in." , "#1B8C1C");
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("registerModal")
    );
    modal.hide();
  })
  .catch((err) => {
    showAlert("Error registering. Please try again." , "#FF0000");
  });
}
// toastify-js

function showAlert(message, type) {
  return Toastify({
      text: message,
      duration: 3000,
      newWindow: true,
      gravity: "top", // `top` or `bottom`
      position: "right", // `left`, `center` or `right`
      stopOnFocus: true, // Prevents dismissing of toast on hover
      style: {
        background: type,
      },
      
    }).showToast();
}