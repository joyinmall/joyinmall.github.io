// script.js

document.addEventListener('DOMContentLoaded', function () {
    const contactPopup = document.getElementById('contact-popup');
    const closePopup = document.getElementById('close-popup');

    // Function to open the popup
    function openPopup() {
        window.location.href = "https://www.joyinmall.com/game";
        $("#loading-spinner").show();
        //contactPopup.style.display = 'block';
    }

    // Function to close the popup
    function closePopupFunc() {
        contactPopup.style.display = 'none';
    }

    // Event listener for opening the popup (e.g., a button click)
    // Replace 'open-button' with the ID of your trigger element
    document.getElementById('startNowButton').addEventListener('click', openPopup);goToShopButton
    document.getElementById('shopNowButton').addEventListener('click', openPopup);
    document.getElementById('startShoppingNowButton').addEventListener('click', openPopup);
    document.getElementById('hereButton').addEventListener('click', openPopup);
    document.getElementById('goToShopButton').addEventListener('click', openPopup);

    // Event listener for closing the popup (close button)
    closePopup.addEventListener('click', closePopupFunc);

    // Event listener for closing the popup (click outside the popup)
    window.addEventListener('click', function (event) {
        if (event.target === contactPopup) {
            closePopupFunc();
        }
    });

    // Prevent form submission for this example
    document.getElementById('contact-form').addEventListener('submit', function (event) {
        event.preventDefault();
        // You can add logic here to handle form submission (e.g., sending data to a server)
    });
});
