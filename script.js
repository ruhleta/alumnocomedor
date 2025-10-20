document.addEventListener('DOMContentLoaded', () => {

            // --- Simulación de datos ---
            const initialState = {
                desayuno: true, 
                almuerzo: false,
                merienda: true,
                cena: false
            };
            const cancellationLimits = {
                desayuno: 8,
                almuerzo: 10,
                merienda: 14,
                cena: 19
            };

            // --- Referencias a elementos del DOM ---
            const userMenuButton = document.getElementById('user-menu-button');
            const userMenu = document.getElementById('user-menu');
            const statusCircle = document.getElementById('status-circle');
            const statusText = document.getElementById('status-text');
            const currentDateEl = document.getElementById('current-date');
            const mealForm = document.getElementById('meal-form');
            const confirmButton = document.getElementById('confirm-button');
            const successAlert = document.getElementById('success-alert');
            const successMessage = document.getElementById('success-message');
            const errorAlert = document.getElementById('error-alert');
            const errorMessage = document.getElementById('error-message');
            const confirmModal = document.getElementById('confirm-modal');
            const modalConfirmBtn = document.getElementById('modal-confirm-btn');
            const modalCancelBtn = document.getElementById('modal-cancel-btn');
            
            // CAMBIO: Nuevas referencias
            const checkboxes = document.querySelectorAll('input[type="checkbox"][data-meal]');
            const mealCards = document.querySelectorAll('.meal-card');

            // CAMBIO: Nueva variable de estado
            let isLocked = true; // Empezamos en estado bloqueado

            // --- Lógica Menú Usuario (sin cambios) ---
            userMenuButton.addEventListener('click', () => {
                const isHidden = userMenu.classList.contains('hidden');
                if (isHidden) {
                    userMenu.classList.remove('hidden');
                    setTimeout(() => userMenu.classList.remove('opacity-0', 'scale-95'), 10);
                } else {
                    userMenu.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => userMenu.classList.add('hidden'), 300);
                }
            });
            window.addEventListener('click', (e) => {
                if (!userMenuButton.contains(e.target) && !userMenu.contains(e.target)) {
                    userMenu.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => userMenu.classList.add('hidden'), 300);
                }
            });

            // --- Lógica Estado Comida (sin cambios) ---
            setTimeout(() => {
                statusCircle.classList.remove('bg-red-500');
                statusCircle.classList.add('bg-green-500');
                statusCircle.title = "Listo";
                statusText.textContent = "¡Listo para retirar!";
                statusText.classList.add('text-green-600');
            }, 5000);

            // --- Lógica Fecha (sin cambios) ---
            const now = new Date();
            currentDateEl.textContent = now.toLocaleDateString('es-ES', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            // --- Cargar Estado Inicial Checkboxes (sin cambios) ---
            Object.keys(initialState).forEach(meal => {
                const checkbox = document.getElementById(`check-${meal}`);
                if (checkbox) checkbox.checked = initialState[meal];
            });

            // --- CAMBIO: Lógica del Formulario (Submit) ---
            // Esta función ahora maneja tanto "Editar" como "Confirmar"
            mealForm.addEventListener('submit', (e) => {
                e.preventDefault(); 
                hideAlerts();
                
                if (isLocked) {
                    // Estado actual: BLOQUEADO -> Acción: Desbloquear
                    enableEditing();
                } else {
                    // Estado actual: DESBLOQUEADO -> Acción: Mostrar modal para confirmar
                    confirmModal.classList.remove('hidden');
                }
            });

            // --- Lógica del Modal (sin cambios) ---
            modalCancelBtn.addEventListener('click', () => {
                confirmModal.classList.add('hidden');
            });

            modalConfirmBtn.addEventListener('click', () => {
                confirmModal.classList.add('hidden');
                processReservation(); // Procesar y al final bloquear
            });

            // --- CAMBIO: Lógica de Procesamiento ---
            function processReservation() {
                const now = new Date();
                const currentHour = now.getHours();
                let errors = [];
                const newSelections = {};

                // 1. Validar cancelaciones
                checkboxes.forEach(checkbox => {
                    const meal = checkbox.dataset.meal;
                    newSelections[meal] = checkbox.checked;

                    const isCancelling = initialState[meal] && !newSelections[meal];
                    const limitHour = cancellationLimits[meal];

                    if (isCancelling && currentHour >= limitHour) {
                        errors.push(`Ya no puedes cancelar el ${meal}. El límite era a las ${limitHour}:00.`);
                        checkbox.checked = true; // Revierte el cambio
                        newSelections[meal] = true;
                    }
                });

                // 2. Mostrar errores o éxito
                if (errors.length > 0) {
                    errorMessage.innerHTML = errors.join('<br>');
                    errorAlert.classList.remove('hidden');
                } else {
                    // Aquí iría el fetch() a PHP
                    console.log('Enviando al servidor:', newSelections);
                    
                    // Actualiza el estado base
                    Object.assign(initialState, newSelections); 
                    
                    successMessage.textContent = "Tus cambios se han guardado correctamente.";
                    successAlert.classList.remove('hidden');
                }
                
                // 3. CAMBIO: Volver a bloquear la UI
                disableEditing();
            }

            // --- CAMBIO: Nuevas funciones para bloquear/desbloquear ---

            /**
             * Bloquea todos los controles de selección.
             * Pone el botón en modo "Editar".
             */
            function disableEditing() {
                isLocked = true;
                confirmButton.textContent = "Editar Selección";
                checkboxes.forEach(cb => cb.disabled = true);
                mealCards.forEach(card => card.classList.add('disabled'));
            }

            /**
             * Desbloquea los controles según la hora límite.
             * Pone el botón en modo "Confirmar".
             */
            function enableEditing() {
                isLocked = false;
                confirmButton.textContent = "Confirmar Cambios";
                
                const now = new Date();
                const currentHour = now.getHours();

                checkboxes.forEach(cb => {
                    const meal = cb.dataset.meal;
                    const limitHour = cancellationLimits[meal];
                    const card = document.getElementById(`card-${meal}`);
                    
                    // Solo habilita si la hora actual es MENOR al límite
                    if (currentHour < limitHour) {
                        cb.disabled = false;
                        card.classList.remove('disabled');
                    } else {
                        // Si ya pasó la hora, se queda deshabilitado
                        cb.disabled = true;
                        card.classList.add('disabled');
                    }
                });
            }

            function hideAlerts() {
                successAlert.classList.add('hidden');
                errorAlert.classList.add('hidden');
            }

            // --- CAMBIO: Estado Inicial ---
            // Inicia la página en estado bloqueado
            disableEditing();
        });