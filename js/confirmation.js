/* Show the selected booking only to its customer. */

var identity = window.getCineVerseIdentity();
var ticketParams = new URLSearchParams(window.location.search);
var reference = ticketParams.get("ref") || sessionStorage.getItem("bookingReference");
var booking = null;

try {
    if (reference && identity.role === "customer") {
        booking = getCustomerBookings(identity.email).find(function(ticket) {
            return ticket.reference === reference;
        });
    }
} catch {
    document.getElementById("ticketErrorMessage").textContent = "The ticket could not be loaded. Check your browser storage and try again.";
}

if (booking) {
    document.getElementById("confirmationContent").style.display = "block";
    document.getElementById("ticketPoster").src = getBookingPoster(booking);
    document.getElementById("ticketReference").textContent = booking.reference;
    document.getElementById("ticketCustomer").textContent = booking.customer;
    document.getElementById("ticketMovie").textContent = booking.movie;
    document.getElementById("ticketCinema").textContent = booking.cinema;
    document.getElementById("ticketDate").textContent = formatBookingDate(booking);
    document.getElementById("ticketTime").textContent = booking.time;
    document.getElementById("ticketSeats").textContent = booking.seats;
    document.getElementById("ticketQuantity").textContent = booking.seats.split(",").length;
    document.getElementById("ticketTotal").textContent = booking.total;
    if (isBookingCancelled(booking)) {
        document.getElementById("ticketOutcomeIcon").textContent = "×";
        document.getElementById("ticketOutcomeIcon").classList.add("is-cancelled");
        document.getElementById("ticketOutcome").textContent = "Booking Cancelled";
        document.getElementById("ticketOutcomeMessage").textContent = "This ticket is void. The seats were released.";
        document.getElementById("ticketStatus").textContent = "Cancelled";
    }
    document.getElementById("ticketQRSection").hidden = !drawTicketQR(document.getElementById("ticketQR"), booking.reference);
    document.getElementById("printTicket").addEventListener("click", function() { window.print(); });
    window.addEventListener("storage", function(event) {
        if (event.key === bookingStoragePrefix + reference) window.location.reload();
    });
} else {
    document.getElementById("confirmationError").style.display = "block";
    if (identity.role === "guest") {
        document.getElementById("ticketErrorMessage").textContent = "Log in with the customer account that booked this ticket.";
        var login = document.getElementById("ticketLogin");
        login.href = "account.html?" + new URLSearchParams({
            returnTo: "confirmation.html" + window.location.search
        });
        login.hidden = false;
    }
}
