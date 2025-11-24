document.addEventListener('DOMContentLoaded', () => {
    // Configuração do botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('auth/logout.php', {
                    method: 'POST',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    window.location.href = 'login.html';
                } else {
                    console.error('Erro ao fazer logout');
                }
            } catch (error) {
                console.error('Erro:', error);
            }
        });
    }

    const form = document.querySelector('form');
    if (!form) return; // Se não houver formulário, retorna (página index)
    
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const submitButton = form.querySelector('button[type="submit"]');
    
    const isLoginPage = form.id === 'login-form';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Reset messages
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        // Add loading state
        submitButton.classList.add('loading');
        submitButton.disabled = true;
        
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        try {
            const endpoint = isLoginPage ? 'auth/login.php' : 'auth/cadastro.php';
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData // Envia como multipart/form-data
            });

            const responseData = await response.json();

            if (responseData.success) {
                if (isLoginPage) {
                    successMessage.textContent = 'Login realizado com sucesso!';
                    successMessage.style.display = 'block';
                    
                    // NOVO: Redirecionamento condicional (já implementado na etapa anterior)
                    const targetPage = responseData.user && responseData.user.is_admin
                        ? 'admin.html' 
                        : 'index.html'; // Ou 'index.php' se você o renomeou

                    setTimeout(() => {
                        window.location.href = targetPage;
                    }, 1000);
                } else {
                    successMessage.textContent = 'Cadastro realizado com sucesso!';
                    successMessage.style.display = 'block';
                    
                    // Redireciona para a página de login para que o usuário se autentique
                    setTimeout(() => {
                        window.location.href = 'login.html'; // <--- CORREÇÃO AQUI
                    }, 1500);
                }
            } else {
                errorMessage.textContent = responseData.error || 'Ocorreu um erro';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Erro:', error);
            errorMessage.textContent = 'Erro ao conectar com o servidor. Verifique o console para mais detalhes.';
            errorMessage.style.display = 'block';
        } finally {
            // Remove loading state
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    });
});
