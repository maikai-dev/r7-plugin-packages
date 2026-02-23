/**
 * Password Generator Plugin
 */
(function (window, undefined) {

    window.Asc.plugin.init = function () {
        // UI Elements
        const passwordOutput = document.getElementById('passwordOutput');
        const lengthRange = document.getElementById('lengthRange');
        const lengthValue = document.getElementById('lengthValue');
        const chkUppercase = document.getElementById('chkUppercase');
        const chkLowercase = document.getElementById('chkLowercase');
        const chkNumbers = document.getElementById('chkNumbers');
        const chkSymbols = document.getElementById('chkSymbols');

        const btnGenerate = document.getElementById('btnGenerate');
        const btnCopy = document.getElementById('btnCopy');
        const btnInsert = document.getElementById('btnInsert');

        // Character Sets
        const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
        const NUMBERS = '0123456789';
        const SYMBOLS = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

        function generatePassword() {
            let charset = '';
            if (chkUppercase.checked) charset += UPPERCASE;
            if (chkLowercase.checked) charset += LOWERCASE;
            if (chkNumbers.checked) charset += NUMBERS;
            if (chkSymbols.checked) charset += SYMBOLS;

            if (charset === '') {
                chkLowercase.checked = true;
                charset += LOWERCASE;
            }

            let length = parseInt(lengthRange.value);
            let password = '';

            // Generate crypto-secure randomness if available
            if (window.crypto && window.crypto.getRandomValues) {
                const values = new Uint32Array(length);
                window.crypto.getRandomValues(values);
                for (let i = 0; i < length; i++) {
                    password += charset[values[i] % charset.length];
                }
            } else {
                for (let i = 0; i < length; i++) {
                    let randomIndex = Math.floor(Math.random() * charset.length);
                    password += charset[randomIndex];
                }
            }

            passwordOutput.value = password;
        }

        // Event Listeners
        lengthRange.addEventListener('input', function () {
            lengthValue.textContent = this.value;
            generatePassword();
        });

        [chkUppercase, chkLowercase, chkNumbers, chkSymbols].forEach(el => {
            el.addEventListener('change', generatePassword);
        });

        btnGenerate.addEventListener('click', generatePassword);

        btnCopy.addEventListener('click', function () {
            passwordOutput.select();
            document.execCommand('copy');
            const originalIcon = btnCopy.textContent;
            btnCopy.textContent = '✅';
            setTimeout(() => { btnCopy.textContent = originalIcon; }, 1000);
        });

        btnInsert.addEventListener('click', function () {
            if (passwordOutput.value) {
                // Paste text securely into the current ONLYOFFICE editor selection
                window.Asc.plugin.executeMethod("PasteText", [passwordOutput.value]);
            }
        });

        // Initialize with a random password
        generatePassword();
    };

    window.Asc.plugin.button = function (id) {
        this.executeCommand("close", "");
    };

})(window, undefined);
