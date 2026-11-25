/* Show bookings owned by the signed-in customer. */

var historyIdentity = window.getCineVerseIdentity();

if (historyIdentity.role === "customer") {
    renderBookingHistory();
    window.addEventListener("storage", function(event) {
        if (!event.key || event.key.startsWith(bookingStoragePrefix)) renderBookingHistory();
    });
}

function renderBookingHistory() {
    var history = document.getElementById("booking-history");
    var empty = document.getElementById("bookingHistoryEmpty");
    var error = document.getElementById("bookingHistoryError");
    var next = document.getElementById("nextBooking");
    var upcoming = document.getElementById("upcomingBookings");
    var previous = document.getElementById("previousBookings");
    history.hidden = false;
    next.replaceChildren();
    next.parentElement.hidden = true;
    upcoming.replaceChildren();
    previous.replaceChildren();
    upcoming.parentElement.hidden = true;
    previous.parentElement.hidden = true;
    error.hidden = true;

    var bookings;
    try {
        bookings = getCustomerBookings(historyIdentity.email);
    } catch {
        empty.hidden = true;
        error.hidden = false;
        error.textContent = "Your bookings could not be loaded. Check browser storage and refresh.";
        return;
    }

    empty.hidden = bookings.length > 0;
    var now = Date.now();
    var future = [];
    var past = [];
    bookings.forEach(function(booking) {
        var screening = getScreeningDate(booking.date, booking.time).getTime();
        var entry = { booking: booking, screening: screening };
        if (screening > now && !isBookingCancelled(booking)) {
            future.push(entry);
        } else {
            past.push(entry);
        }
    });

    future.sort(function(first, second) { return first.screening - second.screening; });
    past.sort(function(first, second) { return second.screening - first.screening; });
    addHistoryCards(next, future.slice(0, 1), "Confirmed");
    addHistoryCards(upcoming, future, "Confirmed");
    addHistoryCards(previous, past, "Past screening");
}

function addHistoryCards(list, entries, status) {
    list.parentElement.hidden = entries.length === 0;
    var template = document.getElementById("bookingHistoryCard");
    entries.forEach(function(entry) {
        var booking = entry.booking;
        var card = template.content.cloneNode(true);
        card.querySelector("img").src = getBookingPoster(booking);
        card.querySelector("h4").textContent = booking.movie;
        var badge = card.querySelector(".history-ticket-status");
        badge.textContent = isBookingCancelled(booking) ? "Cancelled" : status;
        badge.classList.toggle("is-cancelled", isBookingCancelled(booking));
        card.querySelector(".history-ticket-screening").textContent =
            booking.cinema + " · " + formatBookingDate(booking) + " · " + booking.time;
        card.querySelector(".history-ticket-seats").textContent = "Seats: " + booking.seats;
        card.querySelector(".history-ticket-reference").textContent = "Ref: " + booking.reference;
        card.querySelector(".history-ticket-total").textContent = booking.total + " EGP";
        var link = card.querySelector(".history-ticket-link");
        link.href = "confirmation.html?ref=" + encodeURIComponent(booking.reference);
        link.setAttribute("aria-label", "View ticket for " + booking.movie + ", " + booking.reference);
        list.append(card);
    });
}
