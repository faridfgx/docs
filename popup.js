  function showPopup() {
    const popup = document.getElementById("popup");
    const box = document.getElementById("popup-box");
    popup.style.display = "flex";
    setTimeout(() => {
      box.style.transform = "scale(1)";
      box.style.opacity = "1";
    }, 50);
  }
  
  function closePopup() {
    const box = document.getElementById("popup-box");
    box.style.transform = "scale(0.85)";
    box.style.opacity = "0";
    setTimeout(() => {
      document.getElementById("popup").style.display = "none";
    }, 300);
    // Store current timestamp when popup is closed
    localStorage.setItem("popupLastShown", Date.now());
  }
  
  window.onload = function() {
    let lastShown = localStorage.getItem("popupLastShown");
    let now = Date.now();
    let oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Show popup if it's never been shown OR if 24+ hours have passed
    if (!lastShown || now - lastShown > oneDay) {
      showPopup();
    }
  };
  
  // Optional: Add button hover effect
  document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('button');
    if (button) {
      button.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 6px 16px rgba(30,60,114,0.4)';
      });
      button.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(30,60,114,0.3)';
      });
    }
  });