// footer.js - Place this file in your website root or js folder
document.addEventListener('DOMContentLoaded', function() {
  const footerHTML = `
    <footer class ="footer">
        <div class="footer-container">
            <div class="footer-content">
                <!-- Brand Section -->
                <div class="footer-brand">
                    <div class="footer-logo">
                        <div class="logo-icon">CS</div>
                        <div class="logo-text">CSdocs.space</div>
                    </div>
                    <p class="footer-description">
                        منصة تعليمية متخصصة توفر مصادر شاملة لأساتذة المعلوماتية.
                    </p>
					<!--
                    <div class="social-links">
                        <a href="#" class="social-link" title="فيسبوك">📘</a>
                        <a href="#" class="social-link" title="تويتر">🐦</a>
                        <a href="#" class="social-link" title="يوتيوب">📺</a>
                        <a href="#" class="social-link" title="تيليجرام">📱</a>
                    </div>
					-->
                </div>

                <div class="footer-section">
                    <h3>روابط سريعة</h3>
                    <ul class="footer-links">
                        <li><a href="index.html" >الصفحة الرئيسية</a></li>
                        <li><a href="notes.html" >المذكرات</a></li>
                        <li><a href="presentations.html" >العروض التقديمية</a></li>
                        <li><a href="assessment-templates.html" >الاختبارات</a></li>
                        <li><a href="programs.html" >البرامج</a></li>
                    </ul>
                </div>

                <!-- Support -->
               
			   <div class="footer-section">
                    <h3>الدعم والمساعدة</h3>
                    <ul class="footer-links">
                      <!--  <li><a href="#contact">اتصل بنا</a></li>
                        <li><a href="#faq">الأسئلة الشائعة</a></li>
                        <li><a href="#help">مركز المساعدة</a></li> 
                        <li></li> -->
                        <li><p>faridmezane@gmail.com</p></li>
                    </ul>
					</br>
					<div class="jump-buttons">
					<a href="contact.html"> لديك اقتراح لتحسين الموقع</a>
					
                </div></div>
            </div>

            <div class="footer-bottom">
                <div class="copyright">
                    © 2025 CSdocs.space - جميع الحقوق محفوظة
                </div>
				<!--
                <ul class="footer-bottom-links">
                    <li><a href="#privacy">سياسة الخصوصية</a></li>
                    <li><a href="#terms">شروط الاستخدام</a></li>
                    <li><a href="#sitemap">خريطة الموقع</a></li>
                </ul>
				-->
            </div>
        </div>
    </footer>
  `;
  
  // Find the footer container and insert the HTML
  const footerContainer = document.getElementById('footer-container');
  if (footerContainer) {
    footerContainer.innerHTML = footerHTML;
  } else {
    // If no container found, append to body
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }
});