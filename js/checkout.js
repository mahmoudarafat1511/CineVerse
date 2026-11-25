/* Load the screening and seats selected on the booking page. */

var movie = sessionStorage.getItem("movie");
var cinema = sessionStorage.getItem("cinema");
var date = sessionStorage.getItem("date");
var time = sessionStorage.getItem("time");
var seats = sessionStorage.getItem("seats");
var selectedSeats = seats ? seats.split(",").map(function(seat) { return seat.trim(); }) : [];
var total = selectedSeats.length * ticketPrice;
var selectedMovie = findMovie(movie);
var checkoutForm = document.getElementById("checkoutForm");
var confirmButton = document.getElementById("confirmBooking");
var checkoutErrorMessage = document.getElementById("checkoutError");

if (!movie || !cinema || !date || !time || !seats ||
    !selectedMovie || selectedMovie.status !== "Now Showing" ||
    !Object.hasOwn(cinemaNames, cinema) || !total ||
    new Set(selectedSeats).size !== selectedSeats.length ||
    selectedSeats.some(function(seat) { return !/^[A-D][1-6]$/.test(seat); })) {
    checkoutErrorMessage.textContent = "No valid booking found. Please select your tickets first.";
    confirmButton.disabled = true;
    confirmButton.style.opacity = "0.5";
    confirmButton.style.cursor = "not-allowed";
} else {
    document.getElementById("checkoutMovie").textContent = selectedMovie.title;
    document.getElementById("checkoutCinema").textContent = cinemaNames[cinema];
    document.getElementById("checkoutDate").textContent = date;
    document.getElementById("checkoutTime").textContent = time;
    document.getElementById("checkoutSeats").textContent = seats;
    document.getElementById("checkoutQuantity").textContent = selectedSeats.length;
    document.getElementById("checkoutTotal").textContent = total;
    document.getElementById("editSelection").href =
        screeningBookingLink(movie, cinema, date, time) + "&edit=1";
}

checkoutForm.addEventListener("submit", function(event) {
    event.preventDefault();
    validateCheckout();
});

async function validateCheckout() {
    var identity = window.getCineVerseIdentity();
    if (identity.role !== "customer" || confirmButton.disabled) return;

    clearFieldErrors(checkoutForm);
    checkoutErrorMessage.textContent = "";
    var nameField = document.getElementById("customerName");
    var emailField = document.getElementById("customerEmail");
    var phoneField = document.getElementById("customerPhone");
    var name = nameField.value.trim();
    var email = emailField.value.trim();
    var phone = phoneField.value.replace(/[\s-]/g, "");

    if (name.length < 3) {
        showFieldError(nameField, "Please enter your full name (at least 3 characters).");
        return;
    }
    if (!/^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$/u.test(name)) {
        showFieldError(nameField, "Full name must contain letters only. Numbers are not allowed.");
        return;
    }
    if (!emailField.validity.valid || !isValidEmail(email)) {
        showFieldError(emailField, invalidEmailMessage);
        return;
    }
    if (!/^01[0125][0-9]{8}$/.test(phone)) {
        showFieldError(phoneField, "Please enter a valid 11-digit Egyptian mobile number.");
        return;
    }

    /* Recheck the screening inside the booking lock before saving. */
    function confirmSeats() {
        if (window.getCineVerseIdentity().email !== identity.email) {
            checkoutErrorMessage.textContent = "Your session ended. Please log in again to book tickets.";
            return false;
        }
        var draftOwner = sessionStorage.getItem("bookingDraftOwner");
        if (draftOwner && draftOwner !== identity.email) {
            checkoutErrorMessage.textContent = "This selection belongs to a different account. Please start a new booking.";
            return false;
        }

        var reference = sessionStorage.getItem("bookingDraftReference");
        if (!reference) {
            reference = newBookingReference();
            sessionStorage.setItem("bookingDraftReference", reference);
        }

        var existing = findBooking(reference);
        if (existing && existing.customerEmail !== identity.email) {
            checkoutErrorMessage.textContent = "This booking belongs to a different account. Please start a new booking.";
            return false;
        }

        if (!existing) {
            var screeningMovie = findMovie(movie);
            if (!screeningMovie || screeningMovie.status !== "Now Showing") {
                checkoutErrorMessage.textContent = "This movie is no longer available. Please select another movie.";
                return false;
            }
            if (!getScreeningTimes(movie, cinema).includes(time)) {
                checkoutErrorMessage.textContent = "This showtime is no longer available. Edit your selection to choose another.";
                return false;
            }
            if (!(getScreeningDate(date, time).getTime() > Date.now())) {
                checkoutErrorMessage.textContent = "This screening has already started. Please choose a later showtime.";
                return false;
            }
            var occupied = getOccupiedSeats(screeningMovie, cinema, date, time);
            if (selectedSeats.some(function(seat) { return occupied.has(seat); })) {
                checkoutErrorMessage.textContent = "Some of these seats are already booked. Go back and choose available seats.";
                return false;
            }

            saveBooking({
                reference: reference,
                customer: name,
                customerEmail: identity.email,
                movieId: screeningMovie.id,
                movie: screeningMovie.title,
                poster: screeningMovie.poster,
                cinemaId: cinema,
                cinema: cinemaNames[cinema],
                date: date,
                time: time,
                seats: seats,
                total: total,
                status: "confirmed",
                createdAt: Date.now()
            });
        }
        sessionStorage.setItem("bookingReference", reference);
        return true;
    }

    confirmButton.disabled = true;
    confirmButton.textContent = "Confirming…";
    try {
        var confirmed = await updateBookingStorage(confirmSeats);
        if (!confirmed) return;
    } catch {
        checkoutErrorMessage.textContent = "Could not save the booking. Please allow browser storage and try again.";
        return;
    } finally {
        confirmButton.disabled = false;
        confirmButton.textContent = "Confirm Booking";
    }

    window.location.href = "confirmation.html?ref=" + encodeURIComponent(sessionStorage.getItem("bookingReference"));
}
