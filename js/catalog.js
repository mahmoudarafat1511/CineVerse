
/* Movie Information */
var moviesData = [

    {
        title: "Clayface",
        genre: "Horror | Thriller",
        status: "Now Showing",
        id: "1",
        duration: 110,
        rating: "",
        poster: "images/movie1.jpg",
        description: "A terrifying story about a mysterious villain who can change his appearance."
    },

    {
        title: "Resident Evil",
        genre: "Horror | Action",
        status: "Now Showing",
        id: "2",
        duration: 90,
        rating: "",
        poster: "images/movie2.jpg",
        description: "A dangerous outbreak turns the world into a nightmare as survivors fight to stay alive."
    },

    {
        title: "Godzilla Minus Zero",
        genre: "Action | Sci-Fi",
        status: "Now Showing",
        id: "3",
        duration: 135,
        rating: "",
        poster: "images/movie3.jpg",
        description: "Godzilla returns in a thrilling adventure filled with destruction and suspense."
    },

    {
        title: "The Cat in the Hat",
        genre: "Animation | Comedy",
        status: "Now Showing",
        id: "4",
        duration: 115,
        rating: "",
        poster: "images/movie4.jpg",
        description: "A fun animated adventure featuring the mischievous Cat in the Hat."
    },

    {
        title: "Avengers: Doomsday",
        genre: "Action | Sci-Fi",
        status: "Coming Soon",
        id: "5",
        duration: null,
        rating: "",
        poster: "images/movie5.jpg",
        description: "The Avengers return for an epic adventure as they face a powerful new threat."
    },

    {
        title: "Dune: Part Three",
        genre: "Sci-Fi | Adventure",
        status: "Coming Soon",
        id: "6",
        duration: null,
        rating: "",
        poster: "images/movie6.jpg",
        description: "The next chapter of the Dune saga continues with new challenges and adventures."
    },

    {
        title: "Spider-Man: Beyond the Spider-Verse",
        genre: "Animation | Action",
        status: "Coming Soon",
        id: "7",
        duration: null,
        rating: "",
        poster: "images/movie7.jpg",
        description: "Miles Morales continues his journey across the multiverse."
    },

    {
        title: "Avengers: Secret Wars",
        genre: "Action | Sci-Fi",
        status: "Coming Soon",
        id: "8",
        duration: null,
        rating: "",
        poster: "images/movie8.jpg",
        description: "Marvel heroes unite in an epic battle that will change their universe forever."
    }

];


/* Movie Catalog Storage */

var movieStoragePrefix = "cineverseMovie:";
var moviePosterPrefix = "cineversePoster:";

function getMovieCatalog() {
    var catalog = moviesData.slice();

    try {
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key.indexOf(movieStoragePrefix) !== 0) continue;

            var id = key.slice(movieStoragePrefix.length);
            var movie = JSON.parse(localStorage.getItem(key));
            var index = catalog.findIndex(function(item) {
                return item.id === id;
            });

            if (movie) {
                if (index === -1) {
                    catalog.push(movie);
                } else {
                    catalog[index] = movie;
                }
            } else if (index !== -1) {
                // Older versions saved null when a built-in movie was removed.
                var original = catalog[index];
                catalog[index] = {
                    id: original.id,
                    title: original.title,
                    genre: original.genre,
                    duration: original.duration,
                    rating: original.rating,
                    poster: original.poster,
                    description: original.description,
                    status: original.status,
                    removed: true
                };
            }
        }
    } catch {
        // The original catalog is available when browser storage is blocked.
    }

    return catalog;
}

function getMovies() {
    return getMovieCatalog().filter(function(movie) {
        return !movie.hidden && !movie.removed;
    });
}

function findMovie(id) {
    return getMovies().find(function(movie) {
        return movie.id === id;
    });
}

function getMoviePoster(movie) {
    var poster = movie && movie.poster;
    if (poster && poster.startsWith(moviePosterPrefix)) {
        try {
            poster = localStorage.getItem(poster);
        } catch {
            poster = "";
        }
    }
    return poster || "images/banner.jpg";
}

function saveMovie(id, movie, posterData) {
    var posterKey = "";
    if (posterData) {
        // Store the image once so the catalog and all tickets can share it.
        posterKey = moviePosterPrefix + crypto.randomUUID();
        localStorage.setItem(posterKey, posterData);
    }

    try {
        if (posterKey) movie.poster = posterKey;
        localStorage.setItem(movieStoragePrefix + id, JSON.stringify(movie));
    } catch (error) {
        if (posterKey) localStorage.removeItem(posterKey);
        throw error;
    }
}
