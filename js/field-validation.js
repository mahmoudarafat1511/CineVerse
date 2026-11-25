var invalidEmailMessage = "Enter a valid email address";

function isValidEmail(email) {
    return /^[^\s@.]+(?:\.[^\s@.]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(email);
}

/* Pair each field with an error element named after its ID. */
function setFieldError(field, message) {
    document.getElementById(field.id + "Error").textContent = message;
    if (message) {
        field.setAttribute("aria-invalid", "true");
    } else {
        field.removeAttribute("aria-invalid");
    }
}

function showFieldError(field, message) {
    setFieldError(field, message);
    field.focus();
}

function clearFieldErrors(container) {
    container.querySelectorAll('[aria-invalid="true"]').forEach(function(field) {
        setFieldError(field, "");
    });
}

function clearEditedFieldError(event) {
    if (event.target.getAttribute("aria-invalid") === "true") {
        setFieldError(event.target, "");
    }
}

document.addEventListener("input", clearEditedFieldError);
