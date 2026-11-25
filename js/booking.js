/* CineVerse Booking JavaScript */


/* Booking Details */

var bookingMovie = document.getElementById("bookingMovie");
var bookingCinema = document.getElementById("bookingCinema");
var bookingDate = document.getElementById("bookingDate");
var bookingTime = document.getElementById("bookingTime");
var bookingTimeError = document.getElementById("bookingTimeError");
var screeningFields = document.getElementById("screeningFields");
var bookingError = document.getElementById("bookingError");

var seats = document.querySelectorAll(".seat");
var seatSection = document.getElementById("seatSection");
var seatPrompt = document.getElementById("seatPrompt");
var seatAvailability = document.getElementById("seatAvailability");
var selectedSeats = document.getElementById("selectedSeats");
var totalPrice = document.getElementById("totalPrice");

document.getElementById("ticketPrice").textContent = ticketPrice;


/* Load Movies and Apply Showtime Link Details */

function populateBookingMovies(movieId) {
    bookingMovie.options.length = 1;
    getMovies().forEach(function(movie) {
        if (movie.status === "Now Showing") {
            bookingMovie.add(new Option(movie.title, movie.id));
        }
    });

    bookingMovie.value = movieId;
    if (bookingMovie.selectedIndex < 0) bookingMovie.selectedIndex = 0;
}

var bookingParams = new URLSearchParams(window.location.search);
populateBookingMovies(bookingParams.get("id") || "");
populateBookingCinemas("");
bookingDate.value = "";
bookingDate.min = getTodayDate();

var linkedCinema = bookingParams.get("cinema");
var linkedDate = bookingParams.get("date");
var linkedTime = bookingParams.get("time");

if (getScreeningTimes(bookingMovie.value, linkedCinema).length > 0) {
    bookingCinema.value = linkedCinema;
    if (linkedDate && linkedDate >= bookingDate.min) bookingDate.value = linkedDate;
}
updateScreeningFields();
if (linkedTime && !bookingTime.disabled &&
    getScreeningTimes(bookingMovie.value, bookingCinema.value).includes(linkedTime) &&
    getScreeningDate(bookingDate.value, linkedTime).getTime() > Date.now()) {
    bookingTime.value = linkedTime;
}

function populateBookingCinemas(previousCinema) {
    var screenings = getMovieScreenings(bookingMovie.value);
    bookingCinema.options.length = 1;
    screenings.forEach(function(screening) {
        bookingCinema.add(new Option(cinemaNames[screening.cinema], screening.cinema));
    });
    bookingCinema.disabled = screenings.length === 0;
    bookingCinema.value = previousCinema;
    if (bookingCinema.selectedIndex < 0) bookingCinema.selectedIndex = 0;
}

function updateScreeningFields() {
    bookingDate.disabled = !bookingCinema.value;
    if (bookingDate.disabled) bookingDate.value = "";

    var validDate = !bookingDate.disabled && bookingDate.value && bookingDate.validity.valid;
    var previousTime = bookingTime.value;
    bookingTime.options.length = 1;
    bookingTime.disabled = !validDate;
    if (!validDate) return;

    var availableTimes = 0;
    getScreeningTimes(bookingMovie.value, bookingCinema.value).forEach(function(time) {
        var option = new Option(time, time);
        option.disabled = !(getScreeningDate(bookingDate.value, time).getTime() > Date.now());
        bookingTime.add(option);
        if (!option.disabled) {
            availableTimes++;
            if (time === previousTime) bookingTime.value = time;
        }
    });
    if (availableTimes === 0) {
        setFieldError(bookingTime, "No showtimes remain on this date. Choose another date.");
    }
}


/* Seat Selection and Booking Summary */

function getSelectedSeats() {
    return Array.from(seats).filter(function(seat) {
        return seat.classList.contains("selected");
    }).map(function(seat) {
        return seat.textContent.trim();
    });
}

function updateBookingSummary() {
    var selected = getSelectedSeats();
    selectedSeats.textContent = selected.length ? selected.join(", ") : "None";
    document.getElementById("ticketQuantity").textContent = selected.length;
    totalPrice.textContent = selected.length * ticketPrice;
}

function updateSeatAvailability(resetSelection) {
    var movie = findMovie(bookingMovie.value);
    var date = bookingDate.value;
    var hasScreening = Boolean(movie && movie.status === "Now Showing" &&
        bookingCinema.value && date && bookingDate.validity.valid && bookingTime.value);
    var canSelect = hasScreening;
    var occupied = new Set();
    var available = 0;
    var pastScreening = hasScreening && getScreeningDate(date, bookingTime.value).getTime() <= Date.now();

    seatPrompt.hidden = hasScreening;
    seatSection.hidden = !hasScreening;
    var screeningStep = document.getElementById("screeningStep");
    var seatsStep = document.getElementById("seatsStep");
    if (hasScreening) {
        screeningStep.removeAttribute("aria-current");
        seatsStep.setAttribute("aria-current", "step");
    } else {
        seatsStep.removeAttribute("aria-current");
        screeningStep.setAttribute("aria-current", "step");
    }

    try {
        if (pastScreening) {
            canSelect = false;
        } else if (hasScreening) {
            occupied = getOccupiedSeats(movie, bookingCinema.value, date, bookingTime.value);
        }
    } catch {
        canSelect = false;
    }

    seats.forEach(function(seat) {
        var isOccupied = occupied.has(seat.textContent.trim());
        seat.disabled = !canSelect || isOccupied;
        seat.classList.toggle("occupied", isOccupied);
        seat.setAttribute("aria-label", isOccupied ? seat.textContent.trim() + " booked" : seat.textContent.trim());
        if (resetSelection || seat.disabled) seat.classList.remove("selected");
        seat.setAttribute("aria-pressed", seat.classList.contains("selected"));
        if (!seat.disabled) available++;
    });

    if (pastScreening) {
        seatAvailability.textContent = "This screening has already started. Choose a later showtime.";
    } else if (!canSelect) {
        seatAvailability.textContent = "Seat availability could not be loaded.";
    } else if (available === 0) {
        seatAvailability.textContent = "No seats are available for this screening.";
    } else {
        seatAvailability.textContent = available + " seats available";
    }
    updateBookingSummary();
}

seats.forEach(function(seat) {
    seat.addEventListener("click", function() {
        if (seat.disabled || seatSection.hidden) return;

        bookingError.textContent = "";
        seat.classList.toggle("selected");
        seat.setAttribute("aria-pressed", seat.classList.contains("selected"));
        updateBookingSummary();
    });
});

[bookingMovie, bookingCinema, bookingDate, bookingTime].forEach(function(field) {
    field.addEventListener("change", function() {
        bookingError.textContent = "";
        clearFieldErrors(screeningFields);
        if (field === bookingMovie) populateBookingCinemas("");
        if (field === bookingMovie || field === bookingCinema) bookingDate.value = "";
        if (field === bookingMovie || field === bookingCinema || field === bookingDate) {
            bookingTime.value = "";
        }
        updateScreeningFields();
        updateSeatAvailability(true);
    });
});

window.addEventListener("storage", function(event) {
    if (!event.key || event.key.startsWith(movieStoragePrefix)) {
        populateBookingMovies(bookingMovie.value);
        populateBookingCinemas(bookingCinema.value);
        updateScreeningFields();
        updateSeatAvailability(false);
    } else if (event.key.startsWith(bookingStoragePrefix)) {
        updateSeatAvailability(false);
    }
});

window.addEventListener("pageshow", function(event) {
    if (event.persisted) {
        populateBookingMovies(bookingMovie.value);
        populateBookingCinemas(bookingCinema.value);
        updateScreeningFields();
        updateSeatAvailability(false);
    }
});

updateSeatAvailability(true);
restoreDraftSeats();

function restoreDraftSeats() {
    if (bookingParams.get("edit") !== "1" || seatSection.hidden) return;

    var identity = window.getCineVerseIdentity();
    var reference = sessionStorage.getItem("bookingDraftReference");
    if (identity.role !== "customer" || identity.email !== sessionStorage.getItem("bookingDraftOwner") ||
        !reference || sessionStorage.getItem("movie") !== bookingMovie.value ||
        sessionStorage.getItem("cinema") !== bookingCinema.value ||
        sessionStorage.getItem("date") !== bookingDate.value ||
        sessionStorage.getItem("time") !== bookingTime.value) return;

    try {
        if (findBooking(reference)) return;
    } catch {
        return;
    }
    var draftSeats = (sessionStorage.getItem("seats") || "").split(", ");
    var restored = 0;
    seats.forEach(function(seat) {
        if (!seat.disabled && draftSeats.includes(seat.textContent.trim())) {
            seat.classList.add("selected");
            seat.setAttribute("aria-pressed", "true");
            restored++;
        }
    });
    if (restored < draftSeats.length) {
        bookingError.textContent = "Some of your previous seats are no longer available.";
    }
    updateBookingSummary();
}


/* Validate Booking Before Checkout */

document.getElementById("continueToCheckout").addEventListener("click", function() {
    var identity = window.getCineVerseIdentity();
    if (identity.role !== "customer") return;

    var movie = findMovie(bookingMovie.value);
    var cinema = bookingCinema.value;
    var date = bookingDate.value;
    var time = bookingTime.value;
    var selected = getSelectedSeats();
    bookingError.textContent = "";

    if (!movie || movie.status !== "Now Showing") {
        showFieldError(bookingMovie, "Please select a movie.");
        return;
    }
    if (!cinema) {
        showFieldError(bookingCinema, "Select a cinema before continuing.");
        return;
    }
    if (!date || !bookingDate.validity.valid) {
        showFieldError(bookingDate, "Choose today or a future screening date.");
        return;
    }
    if (!time) {
        showFieldError(bookingTime, bookingTimeError.textContent || "Select an available showtime before continuing.");
        return;
    }
    if (!(getScreeningDate(date, time).getTime() > Date.now())) {
        showFieldError(bookingTime, "This screening has already started. Choose a later showtime.");
        return;
    }
    if (selected.length === 0) {
        bookingError.textContent = "Please select at least one seat.";
        bookingError.focus();
        return;
    }

    updateSeatAvailability(false);
    if (getSelectedSeats().length !== selected.length) {
        bookingError.textContent = "Some selected seats are no longer available. Please choose again.";
        bookingError.focus();
        return;
    }

    sessionStorage.setItem("bookingDraftReference", newBookingReference());
    sessionStorage.setItem("bookingDraftOwner", identity.email);
    sessionStorage.removeItem("bookingReference");
    sessionStorage.setItem("movie", movie.id);
    sessionStorage.setItem("cinema", cinema);
    sessionStorage.setItem("date", date);
    sessionStorage.setItem("time", time);
    sessionStorage.setItem("seats", selected.join(", "));

    window.location.href = "checkout.html";
});
