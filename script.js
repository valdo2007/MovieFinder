$(document).ready(function() {

  // ÉTAT GLOBAL DE L'APPLICATION
  let favoris = JSON.parse(localStorage.getItem("favoris")) || [];
  let resultats = {};

  // Mise à jour initiale du badge des favoris
  updateFavBadge();

  // ==========================================
  // 1. ROUTAGE & NAVIGATION DANS LA SPA
  // ==========================================
  
  $("#navSearchBtn").on("click", function() {
    $(".nav-btn").removeClass("active");
    $(this).addClass("active");
    
    $("#favorisView").hide();
    $("#searchView").show();
  });

  $("#navFavBtn").on("click", function() {
    $(".nav-btn").removeClass("active");
    $(this).addClass("active");
    
    $("#searchView").hide();
    afficherFavoris();
    $("#favorisView").show();
  });

  // ==========================================
  // 2. LOGIQUE DE RECHERCHE & API
  // ==========================================

  $("#searchBtn").on("click", function() {
    let recherche = $("#searchInput").val().trim();
    if (recherche !== "") {
      $("#error").text("");
      rechercheFilms(recherche);
    } else {
      $("#error").text("Veuillez saisir un nom.");
    }
  });

  async function rechercheFilms(recherche) {
    try {
      let reponse = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(recherche)}`);
      if (!reponse.ok) throw new Error("Erreur HTTP");

      let donnees = await reponse.json();
      $("#results").empty();
      resultats = {}; // Réinitialisation de l'index de recherche local

      if (donnees.length === 0) {
        $("#results").html("<p>Aucun résultat trouvé.</p>");
        return;
      }

      $.each(donnees, function(index, element) {
        let show = element.show;
        let id = show.id;
        let nom = show.name;
        let langue = show.language || "Inconnue";
        let genres = show.genres || [];
        let image = show.image ? show.image.medium : "https://via.placeholder.com/210x295?text=Pas+d'image";
        let summary = show.summary || "Pas de résumé disponible";

        // Mémorisation de la série pour l'accès instantané aux favoris
        resultats[id] = { id, nom, langue, genres, image, summary };

        let isFav = favoris.some(f => f.id === id);

        $("#results").append(`
          <div class="card" data-id="${id}">
            <img src="${image}" alt="${nom}">
            <div class="card-body">
              <h3>${nom}</h3>
              <p><strong>Langue:</strong> ${langue}</p>
              <p><strong>Genres:</strong> ${genres.join(", ") || "N/A"}</p>
              <div class="summary">${summary}</div>
              <button class="bookmarkBtn ${isFav ? 'saved' : ''}" data-id="${id}">
                ${isFav ? "★ Retirer" : "☆ Ajouter aux favoris"}
              </button>
            </div>
          </div>
        `);
      });

    } catch (error) {
      console.error("Erreur API:", error);
      $("#error").text("Impossible de récupérer les séries.");
    }
  }

  // ==========================================
  // 3. GESTION DES FAVORIS (AJOUT / SUPPRESSION)
  // ==========================================

  // Action d'ajout / retrait depuis la vue Recherche
  $(document).on("click", "#searchView .bookmarkBtn", function() {
    let id = $(this).data("id");
    let showData = resultats[id];
    let index = favoris.findIndex(f => f.id === id);

    if (index === -1) {
      favoris.push(showData);
      $(this).addClass("saved").text("★ Retirer");
    } else {
      favoris.splice(index, 1);
      $(this).removeClass("saved").text("☆ Ajouter aux favoris");
    }

    sauvegarderFavoris();
  });


  
  // Action de suppression directe depuis la vue Favoris
  $(document).on("click", "#favorisView .removeBtn", function() {
    let id = $(this).data("id");
    favoris = favoris.filter(f => f.id !== id);

    sauvegarderFavoris();
    afficherFavoris(); // Rafraîchissement direct du DOM

    // Mise à jour dynamique du bouton si la série est présente dans les résultats courants
    $(`#searchView .bookmarkBtn[data-id="${id}"]`).removeClass("saved").text("☆ Ajouter aux favoris");
  });






  // Rendu de la vue des favoris
  function afficherFavoris() {


    let container = $("#favorisResults");
    container.empty();

    if (favoris.length === 0) {
      container.html("<p>Vous n'avez enregistré aucun favori.</p>");
      return;
    }




    $.each(favoris, function(index, show) {
      container.append(`
        <div class="card" data-id="${show.id}">
          <img src="${show.image}" alt="${show.nom}">
          <div class="card-body">
            <h3>${show.nom}</h3>
            <p><strong>Langue:</strong> ${show.langue}</p>
            <p><strong>Genres:</strong> ${show.genres.join(", ") || "N/A"}</p>
            <div class="summary">${show.summary}</div>
            <button class="removeBtn" data-id="${show.id}">Supprimer</button>
          </div>
        </div>
      `);
    });
  }




  // Utilitaires de persistance et d'état
  function sauvegarderFavoris() {
    localStorage.setItem("favoris", JSON.stringify(favoris));
    updateFavBadge();
  }

  function updateFavBadge() {
    $("#favCount").text(favoris.length);
  }









});