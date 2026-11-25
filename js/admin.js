
/* CineVerse Admin JavaScript */


/* ===================================== */
/* ADMIN DASHBOARD */
/* ===================================== */

var dashboardSection = document.getElementById("dashboardSection");

if (dashboardSection) {
    window.addEventListener("pageshow", function(event) {
        if (event.persisted && sessionStorage.getItem("cineverseAdmin") !== "true") {
            window.location.replace("account.html");
        }
    });

    /* Check Admin Login */

    if (sessionStorage.getItem("cineverseAdmin") != "true") {

        window.location.href = "account.html";

    } else {

        /* Get Dashboard Elements */

        var dashboardButton = document.getElementById("dashboardButton");

        var moviesButton = document.getElementById("moviesButton");

        var bookingsButton = document.getElementById("bookingsButton");
        var accountsButton = document.getElementById("accountsButton");

        var moviesSection = document.getElementById("moviesSection");

        var bookingsSection = document.getElementById("bookingsSection");
        var accountsSection = document.getElementById("accountsSection");

        var pageTitle = document.getElementById("pageTitle");


        /* Show Selected Section */

        function showSection(section, title, activeButton) {

            dashboardSection.style.display = "none";

            moviesSection.style.display = "none";

            bookingsSection.style.display = "none";
            accountsSection.style.display = "none";

            dashboardButton.classList.remove("active");

            moviesButton.classList.remove("active");

            bookingsButton.classList.remove("active");
            accountsButton.classList.remove("active");

            section.style.display = "block";

            pageTitle.innerText = title;

            activeButton.classList.add("active");

        }


        /* Dashboard Button */

        dashboardButton.addEventListener("click", function() {

            showSection(dashboardSection, "Dashboard", dashboardButton);

        });


        /* Manage Movies Button */

        moviesButton.addEventListener("click", function() {

            showSection(moviesSection, "Manage Movies", moviesButton);

        });


        /* Manage Bookings Button */

        bookingsButton.addEventListener("click", function() {

            showSection(bookingsSection, "Manage Bookings", bookingsButton);

        });

        accountsButton.addEventListener("click", function() {
            showSection(accountsSection, "Manage Accounts", accountsButton);
        });


        /* Logout Button */

        document.getElementById("logoutButton").addEventListener("click", function() {

            sessionStorage.removeItem("cineverseAdmin");

            window.location.href = "account.html";

        });

        startAdminDashboard();
        document.body.hidden = false;

    }

}


/* Movie and Booking Management */

function startAdminDashboard() {
    var movieForm = document.getElementById("movieForm");
    var movieFormContainer = document.getElementById("movieFormContainer");
    var movieFormError = document.getElementById("movieFormError");
    var movieListError = document.getElementById("movieListError");
    var editMovieId = document.getElementById("editMovieId");
    var movieTitle = document.getElementById("movieTitle");
    var movieGenre = document.getElementById("movieGenre");
    var movieDuration = document.getElementById("movieDuration");
    var movieRating = document.getElementById("movieRating");
    var moviePoster = document.getElementById("moviePoster");
    var posterPreview = document.getElementById("moviePosterPreview");
    var clearPosterButton = document.getElementById("clearMoviePoster");
    var movieSubmitButton = document.getElementById("movieSubmitButton");
    var currentPoster = "";
    var selectedPosterData = "";
    var posterError = "";
    var posterSelection = 0;
    var movieDescription = document.getElementById("movieDescription");
    var movieStatus = document.getElementById("movieStatus");
    var moviesTable = document.getElementById("adminMoviesTable");
    var bookingsTable = document.getElementById("adminBookingsTable");
    var recentTable = document.getElementById("recentBookingsTable");
    var bookingSearch = document.getElementById("adminBookingSearch");
    var bookingMovieFilter = document.getElementById("adminBookingMovie");
    var bookingCustomerFilter = document.getElementById("adminBookingCustomer");
    var bookingCinemaFilter = document.getElementById("adminBookingCinema");
    var bookingStatusFilter = document.getElementById("adminBookingStatus");
    var bookingStatusMessage = document.getElementById("adminBookingStatusMessage");
    var bookingError = document.getElementById("adminBookingError");
    var bookingDetails = document.getElementById("adminBookingDetails");
    var allBookings = [];
    var accountsTable = document.getElementById("adminAccountsTable");
    var accountSearch = document.getElementById("adminAccountSearch");
    var accountStatus = document.getElementById("adminAccountStatus");
    var accountError = document.getElementById("adminAccountError");


    function openMovieForm(movie) {
        movieForm.reset();
        clearFieldErrors(movieForm);
        movieFormError.textContent = "";
        editMovieId.value = "";
        document.getElementById("movieFormTitle").textContent = movie ? "Edit Movie" : "Add Movie";
        movieSubmitButton.textContent = movie ? "Save Changes" : "Add Movie";
        currentPoster = movie ? getMoviePoster(movie) : "";
        clearSelectedPoster();

        if (movie) {
            editMovieId.value = movie.id;
            movieTitle.value = movie.title;
            movieGenre.value = movie.genre;
            movieDuration.value = movie.duration || "";
            movieRating.value = movie.rating;
            movieDescription.value = movie.description;
            movieStatus.value = movie.status;
        }

        movieFormContainer.style.display = "block";
        movieTitle.focus();
    }

    function showPosterPreview(source) {
        posterPreview.hidden = !source;
        if (source) posterPreview.src = source;
        else posterPreview.removeAttribute("src");
    }

    function clearSelectedPoster() {
        posterSelection++;
        moviePoster.value = "";
        selectedPosterData = "";
        posterError = "";
        clearPosterButton.hidden = true;
        movieSubmitButton.disabled = false;
        setFieldError(moviePoster, "");
        showPosterPreview(currentPoster);
    }

    function readPosterFile(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onerror = reject;
            reader.onload = function() {
                var image = new Image();
                image.onload = function() { resolve(reader.result); };
                image.onerror = reject;
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    moviePoster.addEventListener("change", async function() {
        var selection = ++posterSelection;
        var file = moviePoster.files[0];
        selectedPosterData = "";
        posterError = "";
        setFieldError(moviePoster, "");
        showPosterPreview(currentPoster);
        clearPosterButton.hidden = !file;
        movieSubmitButton.disabled = false;
        if (!file) return;

        if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) {
            posterError = "Choose a JPG, PNG, WebP, GIF, or AVIF image.";
        } else if (file.size > 1024 * 1024) {
            posterError = "Choose an image no larger than 1 MB.";
        }
        if (posterError) {
            showFieldError(moviePoster, posterError);
            return;
        }

        movieSubmitButton.disabled = true;
        try {
            var data = await readPosterFile(file);
            if (selection !== posterSelection) return;
            selectedPosterData = data;
            showPosterPreview(data);
        } catch {
            if (selection !== posterSelection) return;
            posterError = "This file could not be opened as an image. Choose another file.";
            showFieldError(moviePoster, posterError);
        } finally {
            if (selection === posterSelection) movieSubmitButton.disabled = false;
        }
    });

    clearPosterButton.addEventListener("click", function() {
        clearSelectedPoster();
        moviePoster.focus();
    });


    function addTableRow(table, values) {
        var row = table.insertRow();
        values.forEach(function(value) {
            row.insertCell().textContent = value;
        });
        return row;
    }


    function showEmptyTable(table, message, columns) {
        addTableRow(table, [message]).cells[0].colSpan = columns;
    }


    function renderMovies() {
        var movies = getMovieCatalog();
        document.getElementById("totalMovies").textContent = movies.filter(function(movie) {
            return !movie.removed;
        }).length;
        moviesTable.replaceChildren();
        if (movies.length === 0) showEmptyTable(moviesTable, "No movies yet.", 5);

        movies.forEach(function(movie) {
            var status = movie.removed ? "Removed" : movie.hidden ? "Hidden" : movie.status;
            var row = addTableRow(moviesTable, ["", movie.title, movie.genre, status, ""]);
            var poster = document.createElement("img");
            poster.className = "admin-movie-poster";
            poster.src = getMoviePoster(movie);
            poster.alt = "";
            row.cells[0].append(poster);

            if (movie.removed) {
                row.cells[4].append(createMovieAction("Restore", "admin-gray-button", function() {
                    updateMovieVisibility(movie.id, { removed: false, hidden: false });
                }));
                return;
            }

            var edit = document.createElement("button");
            edit.type = "button";
            edit.className = "edit-button";
            edit.textContent = "Edit";
            edit.addEventListener("click", function() {
                openMovieForm(movie);
            });

            var visibility = createMovieAction(movie.hidden ? "Show" : "Hide", "admin-gray-button", function() {
                updateMovieVisibility(movie.id, { hidden: !movie.hidden });
            });

            var remove = document.createElement("button");
            remove.type = "button";
            remove.className = "delete-button";
            remove.textContent = "Remove";
            remove.addEventListener("click", function() { removeMovie(movie); });

            row.cells[4].append(edit, visibility, remove);
        });
    }

    async function removeMovie(movie) {
        try {
            await updateBookingStorage(function() {
                var hasHistory = getBookings().some(function(booking) { return bookingMatchesMovie(booking, movie); });
                var prompt = hasHistory ?
                    "This movie has booking history. Hide " + movie.title + " from public listings and keep all tickets?" :
                    "Remove " + movie.title + " from the movie catalog? You can restore it later.";
                if (!window.confirm(prompt)) return;

                var changes = hasHistory ? { hidden: true } : { removed: true };
                if (!updateMovieVisibility(movie.id, changes)) return;
                if (!hasHistory && editMovieId.value === movie.id) movieFormContainer.style.display = "none";
                if (hasHistory) movieListError.textContent = "Movie hidden. Its booking history was kept.";
            });
        } catch {
            movieListError.textContent = "Could not check booking history. The movie was kept.";
        }
    }

    function createMovieAction(label, className, action) {
        var button = document.createElement("button");
        button.type = "button";
        button.className = className;
        button.textContent = label;
        button.addEventListener("click", action);
        return button;
    }

    function updateMovieVisibility(id, changes) {
        movieListError.textContent = "";
        var movie = getMovieCatalog().find(function(item) { return item.id === id; });
        if (!movie) {
            renderMovies();
            return false;
        }

        try {
            saveMovie(id, { ...movie, ...changes });
            renderMovies();
            return true;
        } catch {
            movieListError.textContent = "Could not update the movie. Check browser storage and try again.";
            return false;
        }
    }


    function renderBookings() {
        recentTable.replaceChildren();
        try {
            allBookings = getBookings();
        } catch {
            allBookings = [];
            bookingsTable.replaceChildren();
            showEmptyTable(recentTable, "Could not load booking history.", 6);
            showEmptyTable(bookingsTable, "Could not load booking history.", 10);
            renderAccounts();
            return;
        }

        updateBookingFilter(bookingMovieFilter, allBookings.map(function(booking) { return booking.movie; }), "All movies");
        updateBookingFilter(bookingCinemaFilter, allBookings.map(function(booking) { return booking.cinema; }), "All cinemas");
        updateBookingFilter(bookingCustomerFilter, allBookings.map(function(booking) {
            return booking.customerEmail;
        }).filter(Boolean), "All customers");
        renderBookingRows();
        renderAccounts();

        var active = allBookings.filter(function(booking) { return !isBookingCancelled(booking); });
        var today = new Date().toDateString();
        var revenue = 0;
        var tickets = 0;
        var todaysBookings = 0;
        active.forEach(function(booking) {
            revenue += Number(booking.total);
            tickets += booking.seats.split(",").length;
            if (new Date(booking.createdAt).toDateString() === today) todaysBookings++;
        });
        allBookings.slice(0, 5).forEach(function(booking) {
            var row = addTableRow(recentTable, [booking.reference, booking.customer, booking.movie,
                booking.seats, booking.total + " EGP", bookingStatusLabel(booking)]);
            row.cells[5].className = "status-" + bookingStatusLabel(booking).toLowerCase();
        });

        if (allBookings.length === 0) showEmptyTable(recentTable, "No bookings yet.", 6);
        document.getElementById("totalBookings").textContent = active.length;
        document.getElementById("totalRevenue").textContent = revenue.toLocaleString("en-EG") + " EGP";
        document.getElementById("ticketsSold").textContent = tickets;
        document.getElementById("todayBookings").textContent = todaysBookings;
        document.getElementById("cancelledBookings").textContent = allBookings.length - active.length;
    }

    function bookingStatusLabel(booking) {
        return isBookingCancelled(booking) ? "Cancelled" : "Confirmed";
    }

    function updateBookingFilter(select, values, label) {
        var selected = select.value;
        var options = Array.from(new Set(values)).sort();
        select.replaceChildren(new Option(label, ""));
        options.forEach(function(value) { select.add(new Option(value, value)); });
        select.value = options.includes(selected) ? selected : "";
    }

    function renderBookingRows() {
        var query = bookingSearch.value.trim().toLowerCase();
        var matches = allBookings.filter(function(booking) {
            return (!query || booking.reference.toLowerCase().includes(query) || booking.customer.toLowerCase().includes(query)) &&
                (!bookingMovieFilter.value || booking.movie === bookingMovieFilter.value) &&
                (!bookingCustomerFilter.value || booking.customerEmail === bookingCustomerFilter.value) &&
                (!bookingCinemaFilter.value || booking.cinema === bookingCinemaFilter.value) &&
                (!bookingStatusFilter.value || bookingStatusLabel(booking).toLowerCase() === bookingStatusFilter.value);
        });

        bookingsTable.replaceChildren();
        bookingStatusMessage.textContent = matches.length + (matches.length === 1 ? " booking" : " bookings");
        if (!matches.length) {
            showEmptyTable(bookingsTable, allBookings.length ? "No bookings match these filters." : "No bookings yet.", 10);
        }

        matches.forEach(function(booking) {
            var status = bookingStatusLabel(booking);
            var row = addTableRow(bookingsTable, [
                booking.reference, booking.customer, booking.movie, booking.cinema,
                formatBookingDate(booking), booking.time, booking.seats, booking.total + " EGP", status, ""
            ]);
            row.cells[8].className = "status-" + status.toLowerCase();
            row.cells[9].append(createMovieAction("View Details", "edit-button", function() {
                showBookingDetails(booking.reference);
            }));
            if (!isBookingCancelled(booking)) {
                row.cells[9].append(createMovieAction("Cancel Booking", "delete-button", function() {
                    cancelBooking(booking.reference);
                }));
            }
        });
    }

    function showBookingDetails(reference) {
        var booking = allBookings.find(function(item) { return item.reference === reference; });
        var details = document.getElementById("adminBookingDetailsList");
        details.replaceChildren();
        var entries = {
            "Reference": booking.reference,
            "Customer": booking.customer,
            "Account": booking.customerEmail || "Unlinked older booking",
            "Movie": booking.movie,
            "Cinema": booking.cinema,
            "Date": formatBookingDate(booking),
            "Showtime": booking.time,
            "Seats": booking.seats,
            "Total": booking.total + " EGP",
            "Status": bookingStatusLabel(booking)
        };
        Object.entries(entries).forEach(function(entry) {
            var label = document.createElement("dt");
            var value = document.createElement("dd");
            label.textContent = entry[0];
            value.textContent = entry[1];
            details.append(label, value);
        });
        bookingDetails.showModal();
    }

    async function cancelBooking(reference) {
        if (!window.confirm("Cancel booking " + reference + " and release its seats?")) return;
        bookingError.textContent = "";

        try {
            await updateBookingStorage(function() {
                var booking = findBooking(reference);
                if (booking && !isBookingCancelled(booking)) {
                    saveBooking({ ...booking, status: "cancelled", cancelledAt: Date.now() });
                }
            });
            renderBookings();
            bookingStatusMessage.textContent = reference + " cancelled. Its seats were released.";
        } catch {
            bookingError.textContent = "Could not cancel the booking. Please try again.";
        }
    }

    bookingSearch.addEventListener("input", renderBookingRows);
    [bookingMovieFilter, bookingCustomerFilter, bookingCinemaFilter, bookingStatusFilter].forEach(function(filter) {
        filter.addEventListener("change", renderBookingRows);
    });

    /* Customer accounts and their booking history */
    function renderAccounts() {
        var query = accountSearch.value.trim().toLowerCase();
        accountsTable.replaceChildren();
        accountStatus.textContent = "";
        try {
            var accounts = window.getCineVerseCustomerAccounts().filter(function(account) {
                return account.name.toLowerCase().indexOf(query) !== -1 ||
                    account.email.indexOf(query) !== -1;
            });
            if (!accounts.length) showEmptyTable(accountsTable, "No customer accounts match your search.", 5);
            accounts.forEach(function(account) {
                var count = allBookings.filter(function(booking) {
                    return booking.customerEmail === account.email;
                }).length;
                var status = account.demo ? "Demo account" : account.removed ? "Removed" : "Active";
                var row = addTableRow(accountsTable, [account.name, account.email, status, count, ""]);
                row.cells[2].className = account.removed ? "status-cancelled" : "status-confirmed";

                var view = createMovieAction("View Bookings", "edit-button", function() {
                    bookingSearch.value = "";
                    bookingMovieFilter.value = "";
                    bookingCinemaFilter.value = "";
                    bookingStatusFilter.value = "";
                    bookingCustomerFilter.value = account.email;
                    bookingsButton.click();
                    renderBookingRows();
                });
                view.disabled = count === 0;
                row.cells[4].append(view);

                if (!account.demo) {
                    var action = account.removed ? "Restore Account" : "Remove Account";
                    var style = account.removed ? "admin-gray-button" : "delete-button";
                    row.cells[4].append(createMovieAction(action, style, function() {
                        updateCustomerAccount(account);
                    }));
                }
            });
        } catch {
            showEmptyTable(accountsTable, "Could not load customer accounts.", 5);
        }
    }

    async function updateCustomerAccount(account) {
        var remove = !account.removed;
        if (remove && !window.confirm("Remove " + account.email + "? They will lose access and their bookings will be kept.")) return;

        accountError.textContent = "";
        accountStatus.textContent = "";
        try {
            var updated = await updateBookingStorage(function() {
                return window.setCineVerseCustomerAccountRemoved(account.email, remove);
            });
            if (!updated) {
                accountError.textContent = "This account could not be updated.";
                return;
            }
            renderAccounts();
            accountStatus.textContent = remove ? "Account removed. Booking history was kept." : "Account restored.";
        } catch {
            accountError.textContent = "This account could not be updated. Please try again.";
        }
    }

    accountSearch.addEventListener("input", renderAccounts);


    document.getElementById("addMovieButton").addEventListener("click", function() {
        openMovieForm();
    });

    document.getElementById("cancelMovieButton").addEventListener("click", function() {
        clearSelectedPoster();
        movieFormContainer.style.display = "none";
    });

    movieForm.addEventListener("submit", function(event) {
        event.preventDefault();
        if (movieSubmitButton.disabled) return;
        clearFieldErrors(movieForm);
        movieFormError.textContent = "";

        var title = movieTitle.value.trim();
        var genre = movieGenre.value.trim();
        var duration = Number(movieDuration.value);
        var status = movieStatus.value;
        var id = editMovieId.value;

        if (!title) {
            showFieldError(movieTitle, "Enter the movie title.");
            return;
        }
        if (!genre) {
            showFieldError(movieGenre, "Enter the movie genre.");
            return;
        }

        if ((status === "Now Showing" || movieDuration.value !== "") &&
            (!Number.isInteger(duration) || duration < 1 || duration > 600)) {
            showFieldError(movieDuration, "Enter a duration between 1 and 600 minutes.");
            return;
        }

        if (posterError) {
            showFieldError(moviePoster, posterError);
            return;
        }

        var existingMovie = getMovieCatalog().find(function(movie) { return movie.id === id; });
        if (id && (!existingMovie || existingMovie.removed)) {
            movieFormError.textContent = "This movie has already been removed.";
            return;
        }

        try {
            id = id || crypto.randomUUID();
            saveMovie(id, {
                id: id,
                title: title,
                previousTitles: existingMovie && existingMovie.title !== title ?
                    Array.from(new Set([...(existingMovie.previousTitles || []), existingMovie.title])) :
                    (existingMovie?.previousTitles || []),
                genre: genre,
                duration: duration || null,
                rating: movieRating.value,
                poster: existingMovie?.poster || "images/banner.jpg",
                description: movieDescription.value.trim(),
                hidden: Boolean(existingMovie && existingMovie.hidden),
                status: status
            }, selectedPosterData);
            movieFormContainer.style.display = "none";
            clearSelectedPoster();
            renderMovies();
        } catch (error) {
            movieFormError.textContent = error.name === "QuotaExceededError" ?
                "Browser storage is full. Try a smaller poster image." :
                "Could not save the movie. Check browser storage and try again.";
        }
    });

    window.addEventListener("storage", function(event) {
        if (!event.key || event.key.startsWith(movieStoragePrefix)) renderMovies();
        if (!event.key || event.key.startsWith(bookingStoragePrefix)) renderBookings();
        if (!event.key || event.key.startsWith("cineverseAccount:")) renderAccounts();
    });

    renderMovies();
    renderBookings();
}
