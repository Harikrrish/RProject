let timeoutTriggered = false;

async function isUserDetailsTaken() {
    let isUserDetailsTaken = localStorage.getItem("isUserDetailsTaken");
    if (!isUserDetailsTaken || (isUserDetailsTaken && isUserDetailsTaken !== "true")) {
        return true;
    } else {
        return false;
    }
}

async function loadUserDetailsPopup() {
    // if (!timeoutTriggered) {
        // timeoutTriggered = true;
        let isUserDetailsTaken = localStorage.getItem("isUserDetailsTaken");
        if (!isUserDetailsTaken || (isUserDetailsTaken && isUserDetailsTaken !== "true")) {
            openPopup();
        }
    // }
}

async function openPopup() {
    const isUserDetailsTaken = localStorage.getItem("isUserDetailsTaken");
    if (isUserDetailsTaken !== "true") {
        let popupElement = document.getElementById("popup");
        if (popupElement) popupElement.style.display = "block";

        let overlayElement = document.getElementById("overlay");
        if (overlayElement) overlayElement.style.display = "block";
    }
}

async function closePopup() {
    let popupElement = document.getElementById("popup");
    if (popupElement) popupElement.style.display = "none";

    let overlayElement = document.getElementById("overlay");
    if (overlayElement) overlayElement.style.display = "none";

    localStorage.setItem("isUserDetailsTaken", "true");
}

async function validateForm() {
    var name = document.getElementById("name")?.value;
    var email = document.getElementById("email")?.value;
    var phone = document.getElementById("phone")?.value;

    if (name.trim() && email.trim() && phone.trim() && phone.trim().length === 10) {
        sendEmail(name, email, phone);
        closePopup();
    } else {
        alert("Please fill out all fields.");
        return false;
    }
}

async function sendEmail(name, email, phone) {
    let bodyParams = {
        name: name,
        email: email,
        phone: phone
    };
    try {
        const response = await fetch("https://rprojectmail-production.up.railway.app", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyParams),
        });

        if (!response.ok) {
            console.log(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

async function sendContactEmail() {
    var name = document.getElementById("contactname");
    var email = document.getElementById("contactemail");
    var phone = document.getElementById("contactphone");
    if (name?.value.trim() && email?.value.trim() && phone?.value.trim().length === 10) {
        sendEmail(name?.value, email?.value, phone?.value);
        name.value = "";
        email.value = "";
        phone.value = "";
        alert("Thank you for contacting us. We will contact you shortly!");
    } else {
        alert("Please fill out all fields.");
    }
}
