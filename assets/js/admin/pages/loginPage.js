import { adminAuth } from '../authService.js';

export class LoginPage {
  async init() {
    const appRoot = document.getElementById('app-root');

    appRoot.innerHTML = `
      <div class="admin-login">
        <div class="admin-login__card">
          <h1 class="admin-login__title">Administration</h1>
          <p class="admin-login__subtitle">Photographe Andalou</p>
          <form id="login-form" class="admin-form">
            <div class="admin-form__group">
              <label for="admin-email">Email</label>
              <input type="email" id="admin-email" required autocomplete="email"
                     placeholder="admin@photographe-andalou.com">
            </div>
            <div class="admin-form__group">
              <label for="admin-password">Mot de passe</label>
              <input type="password" id="admin-password" required autocomplete="current-password"
                     placeholder="Mot de passe" minlength="8">
            </div>
            <div id="login-error" class="admin-alert admin-alert--error" hidden></div>
            <button type="submit" class="admin-btn admin-btn--primary admin-btn--full">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const submitBtn = form.querySelector('button[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorEl.hidden = true;

      const email = document.getElementById('admin-email').value;
      const password = document.getElementById('admin-password').value;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Connexion...';

      try {
        await adminAuth.login(email, password);
        window.location.hash = '#/admin';
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
      }
    });
  }

  destroy() {}
}
