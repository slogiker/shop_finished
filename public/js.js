document.addEventListener('DOMContentLoaded', () => {
    // Wrap existing content
    const contentWrapper = document.createElement('div');
    contentWrapper.id = 'content';
    while (document.body.firstChild) {
        contentWrapper.appendChild(document.body.firstChild);
    }
    document.body.appendChild(contentWrapper);

    // Add navBar
    const navBar = document.createElement('div');
    navBar.style.display = 'flex';
    navBar.style.justifyContent = 'space-between';
    navBar.style.padding = '10px';
    navBar.style.backgroundColor = '#333';
    navBar.style.color = 'white';

    const logo = document.createElement('img');
    logo.src = "slike/logo.png";
    logo.id = "logo";
    navBar.appendChild(logo);
    logo.addEventListener('click', () => {
        window.open('shop.html', '_self');
    });

    const buttonContainer = document.createElement('div');

    // Login button
    const loginButton = document.createElement('button');
    loginButton.textContent = 'Login';
    loginButton.className = 'custom-button';
    loginButton.style.marginRight = '10px';
    loginButton.addEventListener('click', () => window.open('login.html', '_self'));
    buttonContainer.appendChild(loginButton);

    // Register button
    const registerButton = document.createElement('button');
    registerButton.textContent = 'Register';
    registerButton.className = 'custom-button';
    registerButton.addEventListener('click', () => window.open('register.html', '_self'));
    buttonContainer.appendChild(registerButton);

    // Basket button
    const basketButton = document.createElement('button');
    basketButton.textContent = 'Basket'; // Use text content like other buttons
    basketButton.className = 'custom-button';
    basketButton.style.marginRight = '10px';
    basketButton.style.display = 'none';
    basketButton.addEventListener('click', () => window.open('basket.html', '_self'));
    buttonContainer.appendChild(basketButton);

    // Logout button
    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Logout';
    logoutButton.className = 'custom-button';
    logoutButton.style.marginRight = '10px';
    logoutButton.style.display = 'none';
    logoutButton.addEventListener('click', () => {
        fetch('/logout', { method: 'POST' })
            .then(response => {
                if (response.ok) {
                    alert('Odjavleni ste');
                    window.location.href = '/login.html';
                } else {
                    alert('Napaka pri odjavi');
                }
            })
            .catch(error => console.error('Error logging out:', error));
    });
    buttonContainer.appendChild(logoutButton);

    // Forum button
    const forumButton = document.createElement('button');
    forumButton.textContent = 'Forum';
    forumButton.className = 'custom-button';
    forumButton.style.marginRight = '10px';
    forumButton.style.display = 'none';
    forumButton.addEventListener('click', () => {
        window.open('forum.html', '_self');
    });
    buttonContainer.appendChild(forumButton);

    // Add footer
    const footer = document.createElement('footer');
    footer.innerHTML = `
        <div>
            <img src="slike/logo.png" alt="Logo" id="footerLogo">
            <p>© 2025 MyDrugs Online. All rights reserved.</p>
            <p class="footerLink" onclick="window.open('forum.html', '_self');">Forum</p>
            <p class="footerLink" onclick="window.open('contact.html', '_self');">Contact Us</p>
        </div>
    `;
    document.body.appendChild(footer);

    // Check authentication status and adjust visibility
    fetch('/check-auth')
        .then(response => response.json())
        .then(data => {
            const isForumPage = window.location.pathname.endsWith('forum.html');
            if (data.authenticated) {
                loginButton.style.display = 'none';
                registerButton.style.display = 'none';
                basketButton.style.display = 'inline-block';
                if (isForumPage) {
                    logoutButton.style.display = 'none';
                    forumButton.style.display = 'none';
                    categoryElements.forEach(span => span.style.display = 'inline-block');
                } else {
                    logoutButton.style.display = 'inline-block';
                    forumButton.style.display = 'inline-block';
                    categoryElements.forEach(span => span.style.display = 'none');
                }
            } else {
                loginButton.style.display = 'inline-block';
                registerButton.style.display = 'inline-block';
                basketButton.style.display = 'none';
                logoutButton.style.display = 'none';
                forumButton.style.display = 'none';
                categoryElements.forEach(span => span.style.display = 'none');
            }
        })
        .catch(error => console.error('Error checking auth:', error));

    // Add to Basket functionality
    const addToBasketButtons = document.querySelectorAll('.add-to-basket');
    addToBasketButtons.forEach(button => {
        button.addEventListener('click', () => {
            const item = button.closest('.item');
            const name = item.getAttribute('data-name');
            const quantity = parseInt(item.querySelector('.quantity').value);
            const priceBTC = parseFloat(item.getAttribute('data-price-btc'));
            const priceETH = parseFloat(item.getAttribute('data-price-eth'));

            if (quantity < 1) {
                alert('Please select a valid quantity');
                return;
            }

            fetch('/add-to-basket', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, quantity, priceBTC, priceETH })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Added to basket');
                } else {
                    alert('Error adding to basket');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error adding to basket');
            });
        });
    });
});

// Toggle password visibility
function togglePassword(section) {
    let passwordFields, toggleButton;
    if (section === 'login') {
        passwordFields = [document.getElementById("password")];
        toggleButton = document.getElementById("toggle-login-password");
    } else if (section === 'register') {
        passwordFields = [
            document.getElementById("register-password"),
            document.getElementById("register-password-repeat")
        ];
        toggleButton = document.getElementById("toggle-register-password");
    }

    passwordFields.forEach(passwordField => {
        if (passwordField && passwordField.type === "password") {
            passwordField.type = "text";
        } else if (passwordField) {
            passwordField.type = "password";
        }
    });

    if (toggleButton && passwordFields[0] && passwordFields[0].type === "password") {
        toggleButton.textContent = "Show";
    } else if (toggleButton) {
        toggleButton.textContent = "Hide";
    }
}