// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
  });
  
  // Department category filtering
  document.addEventListener('DOMContentLoaded', function() {
    // Initially show only tech category
    showCategory('tech');
    
    // Add event listeners to category tabs
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Add active class to clicked tab
        this.classList.add('active');
        // Show cards for this category
        showCategory(this.getAttribute('data-category'));
      });
    });
    
    // Floating elements animation
    const floatElements = document.querySelectorAll('.float-element');
    floatElements.forEach(element => {
      animate(element);
    });
    
    // Animate hero text
    const heroText = document.querySelector('.animated-text');
    if (heroText) {
      textAnimation(heroText);
    }
  });
  
  // Show only cards of selected category
  function showCategory(category) {
    const allCards = document.querySelectorAll('.material-card');
    allCards.forEach(card => {
      if (card.getAttribute('data-category') === category) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }
  
  // Floating animation for elements
  function animate(element) {
    const speed = element.getAttribute('data-speed');
    let posX = Math.random() * 80;
    let posY = Math.random() * 50;
    let dirX = Math.random() > 0.5 ? 1 : -1;
    let dirY = Math.random() > 0.5 ? 1 : -1;
    
    setInterval(() => {
      posX += 0.05 * speed * dirX;
      posY += 0.05 * speed * dirY;
      
      // Bounce off edges
      if (posX > 90 || posX < 0) dirX *= -1;
      if (posY > 90 || posY < 0) dirY *= -1;
      
      element.style.left = posX + '%';
      element.style.top = posY + '%';
    }, 30);
  }
  
  // Text animation for hero heading
  function textAnimation(element) {
    const text = element.innerText;
    element.innerHTML = '';
    
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.innerText = text[i] === ' ' ? '\u00A0' : text[i];
      span.style.animationDelay = (i * 0.1) + 's';
      span.classList.add('animate-in');
      element.appendChild(span);
    }
  }