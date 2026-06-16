# API Reference — Stock & Caisse

> **Base URL** : `http://localhost:8013/api/v1`  
> **Swagger UI** : `http://localhost:8013/api/v1/docs`  
> **Auth** : Bearer JWT — header `Authorization: Bearer <accessToken>`  
> **Toutes les réponses** sont enveloppées dans le format standard :

```json
{
  "data": <payload>,
  "statusCode": 200,
  "timestamp": "2026-06-16T10:00:00.000Z"
}
```

> Les erreurs retournent `{ "statusCode", "message", "error", "code" }` avec un code HTTP approprié.

---

## Enums

| Enum | Valeurs |
|---|---|
| `UserRole` | `ADMIN` `VENDEUR` |
| `TailleVariante` | `XS` `S` `M` `L` `XL` `XXL` `XXXL` |
| `TypeMouvementStock` | `ENTREE` `SORTIE` `AJUSTEMENT` `RETOUR` |
| `TypeSortie` | `VENTE` `PERTE` `DON` `RETOUR_FOURNISSEUR` |
| `StatutSessionCaisse` | `OUVERTE` `FERMEE` |
| `ModePaiement` | `CASH` `WAVE` `ORANGE_MONEY` `CARTE` `MTN_MONEY` |

---

## Pagination (paramètres communs)

Tous les endpoints listant des collections acceptent ces query params :

| Param | Type | Défaut | Description |
|---|---|---|---|
| `page` | integer ≥ 1 | `1` | Numéro de page |
| `limit` | integer 1–100 | `20` | Éléments par page |
| `sortBy` | string | `createdAt` | Champ de tri |
| `sortOrder` | `asc` \| `desc` | `desc` | Ordre de tri |

**Format de réponse paginée :**

```json
{
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "pageCount": 3
  }
}
```

---

## 1. Auth

### POST `/auth/login`
Authentifie un utilisateur et retourne les tokens.

**Corps :**
```json
{
  "email": "admin@shop.com",
  "password": "StrongPass123!"
}
```

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `email` | string | oui | format email valide |
| `password` | string | oui | min 8 caractères |

**Réponse 201 :**
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "email": "admin@shop.com",
    "role": "ADMIN"
  }
}
```

---

### POST `/auth/refresh`
Génère un nouvel `accessToken` à partir du `refreshToken`.

**Corps :**
```json
{
  "refreshToken": "eyJhbGci..."
}
```

**Réponse 201 :**
```json
{
  "accessToken": "eyJhbGci..."
}
```

---

### POST `/auth/logout`
Déconnecte la session courante. Aucun corps requis.

**Réponse 201 :**
```json
{
  "success": true
}
```

---

## 2. Utilisateurs

> Tous les endpoints suivants nécessitent `Authorization: Bearer <accessToken>`

### POST `/users`
Crée un nouvel utilisateur (ADMIN uniquement).

**Corps :**
```json
{
  "email": "vendeur@shop.com",
  "password": "StrongPass123!",
  "role": "VENDEUR"
}
```

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `email` | string | oui | format email, unique |
| `password` | string | oui | min 8 caractères |
| `role` | `UserRole` | non | défaut `VENDEUR` |

**Réponse 201 :**
```json
{
  "id": "uuid",
  "email": "vendeur@shop.com",
  "role": "VENDEUR",
  "createdAt": "2026-06-16T10:00:00.000Z",
  "updatedAt": "2026-06-16T10:00:00.000Z"
}
```

---

## 3. Produits

### GET `/produits`
Liste paginée des produits avec leurs variantes.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `page` | integer | Pagination |
| `limit` | integer | Pagination |
| `categorieId` | string (uuid) | Filtrer par catégorie |
| `search` | string | Recherche sur nom / SKU |
| `isActif` | boolean | Filtrer actifs/inactifs |

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "nom": "T-shirt Premium",
      "sku": "TSH-001",
      "description": "T-shirt coton premium",
      "categorieId": "uuid",
      "prixVente": "12500.00",
      "prixAchat": "8000.00",
      "imageUrl": "https://...",
      "isActif": true,
      "createdAt": "2026-06-16T10:00:00.000Z",
      "updatedAt": "2026-06-16T10:00:00.000Z",
      "categorie": { "id": "uuid", "nom": "Vêtements", "slug": "vetements" },
      "variantes": [
        {
          "id": "uuid",
          "taille": "M",
          "couleur": "Noir",
          "quantiteStock": 25,
          "seuilAlerte": 5
        }
      ]
    }
  ],
  "meta": { "total": 4, "page": 1, "limit": 20, "pageCount": 1 }
}
```

---

### GET `/produits/:id`
Récupère un produit avec toutes ses variantes.

**Réponse 200 :** objet `Produit` complet (même structure que ci-dessus, sans pagination).

---

### POST `/produits`
Crée un produit (avec variantes optionnelles en une seule requête).

**Corps :**
```json
{
  "nom": "T-shirt Premium",
  "sku": "TSH-001",
  "description": "T-shirt coton premium",
  "categorieId": "uuid",
  "prixVente": "12500.00",
  "prixAchat": "8000.00",
  "imageUrl": "https://images.example.com/tshirt.jpg",
  "variantes": [
    {
      "taille": "M",
      "couleur": "Noir",
      "quantiteStock": 25,
      "seuilAlerte": 5
    }
  ]
}
```

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `nom` | string | oui | — |
| `sku` | string | non | unique (auto-généré si absent) |
| `description` | string | non | — |
| `categorieId` | string (uuid) | oui | — |
| `prixVente` | string decimal | oui | ex : `"12500.00"` |
| `prixAchat` | string decimal | oui | ex : `"8000.00"` |
| `imageUrl` | string (url) | non | — |
| `variantes[].taille` | `TailleVariante` | oui | `XS` `S` `M` `L` `XL` `XXL` `XXXL` |
| `variantes[].couleur` | string | oui | — |
| `variantes[].quantiteStock` | integer ≥ 0 | oui | — |
| `variantes[].seuilAlerte` | integer ≥ 0 | oui | — |

**Réponse 201 :** objet `Produit` complet avec variantes créées.

---

### PATCH `/produits/:id`
Met à jour un produit (tous les champs sont optionnels).

**Corps :**
```json
{
  "nom": "T-shirt Premium V2",
  "description": "Nouvelle description",
  "prixVente": "13000.00",
  "prixAchat": "8500.00",
  "imageUrl": "https://...",
  "isActif": true
}
```

**Réponse 200 :** objet `Produit` mis à jour.

---

### DELETE `/produits/:id`
Désactivation logique du produit (`isActif = false`). Aucune suppression physique.

**Réponse 200 :**
```json
{ "id": "uuid", "isActif": false, ... }
```

---

### GET `/produits/:id/mouvements`
Liste les mouvements de stock d'un produit.

**Query params :** `page`, `limit`

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "varianteId": "uuid",
      "type": "ENTREE",
      "quantite": 20,
      "motif": "Réception initiale",
      "referenceEntree": "ENT-2026-001",
      "referenceSortie": null,
      "userId": "uuid",
      "createdAt": "2026-06-16T10:00:00.000Z"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20, "pageCount": 1 }
}
```

---

## 4. Stock

### GET `/stock`
Liste le stock courant (toutes les variantes avec leur produit).

**Query params :**

| Param | Type | Description |
|---|---|---|
| `alerte` | boolean | `true` = uniquement les variantes sous seuil |
| `taille` | `TailleVariante` | Filtrer par taille |
| `couleur` | string | Filtrer par couleur |
| `categorieId` | string (uuid) | Filtrer par catégorie |
| `page`, `limit`, `sortBy`, `sortOrder` | — | Pagination |

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "produitId": "uuid",
      "taille": "M",
      "couleur": "Noir",
      "quantiteStock": 25,
      "seuilAlerte": 5,
      "createdAt": "2026-06-16T10:00:00.000Z",
      "updatedAt": "2026-06-16T10:00:00.000Z",
      "produit": {
        "id": "uuid",
        "nom": "T-shirt Premium",
        "sku": "TSH-001",
        "prixVente": "12500.00",
        "categorie": { "nom": "Vêtements" }
      }
    }
  ],
  "meta": { "total": 6, "page": 1, "limit": 20, "pageCount": 1 }
}
```

---

### GET `/stock/alertes`
Retourne uniquement les variantes dont `quantiteStock <= seuilAlerte`.

**Réponse 200 :** même structure que `/stock` (sans pagination), tableau de variantes en alerte.

---

### GET `/stock/mouvements`
Liste tous les mouvements de stock.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `type` | `TypeMouvementStock` | `ENTREE` `SORTIE` `AJUSTEMENT` `RETOUR` |
| `dateDebut` | ISO 8601 | ex : `2026-01-01` |
| `dateFin` | ISO 8601 | ex : `2026-12-31` |
| `produitId` | string (uuid) | Filtrer par produit |
| `page`, `limit` | — | Pagination |

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "varianteId": "uuid",
      "type": "ENTREE",
      "quantite": 20,
      "motif": "Réception initiale",
      "referenceEntree": "ENT-2026-001",
      "referenceSortie": null,
      "userId": "uuid",
      "createdAt": "2026-06-16T10:00:00.000Z",
      "variante": {
        "taille": "M",
        "couleur": "Noir",
        "produit": { "nom": "T-shirt Premium", "sku": "TSH-001" }
      },
      "user": { "email": "admin@shop.com" }
    }
  ],
  "meta": { "total": 10, "page": 1, "limit": 20, "pageCount": 1 }
}
```

---

## 5. Variantes

### PATCH `/variantes/:id`
Met à jour la taille, la couleur ou le seuil d'alerte d'une variante.

**Corps :**
```json
{
  "taille": "L",
  "couleur": "Blanc",
  "seuilAlerte": 3
}
```

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `taille` | `TailleVariante` | non | — |
| `couleur` | string | non | — |
| `seuilAlerte` | integer | non | — |

**Réponse 200 :** objet `Variante` mis à jour.

---

### PATCH `/variantes/:id/stock`
Ajustement manuel du stock (génère un mouvement `AJUSTEMENT`).

**Corps :**
```json
{
  "variation": -3,
  "motif": "Inventaire physique"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `variation` | integer ≠ 0 | oui | Positif = ajout, négatif = retrait |
| `motif` | string | non | Défaut : `"Ajustement manuel"` |

**Réponse 200 :** objet `Variante` avec le stock mis à jour.

---

## 6. Entrées (approvisionnements)

### GET `/entrees`
Liste paginée des entrées de stock.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `dateDebut` | ISO 8601 | — |
| `dateFin` | ISO 8601 | — |
| `fournisseur` | string | Recherche partielle |
| `page`, `limit` | — | Pagination |

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "ENT-2026-001",
      "fournisseur": "Grossiste Dakar",
      "totalCout": "124000.00",
      "notes": "Livraison initiale du mois",
      "userId": "uuid",
      "createdAt": "2026-06-16T10:00:00.000Z",
      "lignes": [
        {
          "id": "uuid",
          "varianteId": "uuid",
          "quantite": 20,
          "prixUnitaire": "5000.00",
          "variante": {
            "taille": "M",
            "couleur": "Noir",
            "produit": { "nom": "T-shirt Premium" }
          }
        }
      ]
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "pageCount": 1 }
}
```

---

### GET `/entrees/:id`
Récupère une entrée avec ses lignes.

**Réponse 200 :** même structure qu'un élément du tableau ci-dessus.

---

### POST `/entrees`
Crée une entrée. Génère automatiquement :
- les mouvements de stock `ENTREE` pour chaque ligne
- une `reference` unique (`ENT-YYYY-XXX`)
- le `totalCout` calculé

**Corps :**
```json
{
  "fournisseur": "Grossiste Dakar",
  "notes": "Livraison initiale",
  "lignes": [
    {
      "varianteId": "uuid",
      "quantite": 20,
      "prixUnitaire": "5000.00"
    },
    {
      "varianteId": "uuid",
      "quantite": 10,
      "prixUnitaire": "7000.00"
    }
  ]
}
```

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `fournisseur` | string | oui | — |
| `notes` | string | non | — |
| `lignes` | array | oui | min 1 élément |
| `lignes[].varianteId` | string (uuid) | oui | — |
| `lignes[].quantite` | integer ≥ 1 | oui | — |
| `lignes[].prixUnitaire` | string decimal | oui | ex : `"5000.00"` |

**Réponse 201 :** objet `Entree` complet avec lignes.

---

### PATCH `/entrees/:id/annuler`
Annule une entrée. Génère des mouvements `AJUSTEMENT` inverses pour restaurer le stock.

**Réponse 200 :** objet `Entree` avec statut mis à jour.

---

## 7. Sorties (ventes / pertes / dons)

### GET `/sorties`
Liste paginée des sorties.

**Query params :**

| Param | Type | Description |
|---|---|---|
| `type` | `TypeSortie` | `VENTE` `PERTE` `DON` `RETOUR_FOURNISSEUR` |
| `dateDebut` | ISO 8601 | — |
| `dateFin` | ISO 8601 | — |
| `page`, `limit` | — | Pagination |

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "reference": "SRT-2026-001",
      "type": "VENTE",
      "totalMontant": "12500.00",
      "notes": "Vente de démonstration",
      "userId": "uuid",
      "createdAt": "2026-06-16T10:00:00.000Z",
      "lignes": [
        {
          "id": "uuid",
          "varianteId": "uuid",
          "quantite": 2,
          "prixUnitaire": "12500.00",
          "variante": {
            "taille": "M",
            "couleur": "Noir",
            "produit": { "nom": "T-shirt Premium" }
          }
        }
      ]
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "pageCount": 1 }
}
```

---

### GET `/sorties/:id`
Récupère une sortie avec ses lignes.

**Réponse 200 :** même structure qu'un élément ci-dessus.

---

### POST `/sorties`
Crée une sortie. Génère automatiquement :
- les mouvements de stock `SORTIE` pour chaque ligne
- une `reference` unique (`SRT-YYYY-XXX`)
- le `totalMontant` calculé

**Corps :**
```json
{
  "type": "VENTE",
  "notes": "Vente comptoir",
  "lignes": [
    {
      "varianteId": "uuid",
      "quantite": 2,
      "prixUnitaire": "12500.00"
    }
  ]
}
```

| Champ | Type | Requis | Contraintes |
|---|---|---|---|
| `type` | `TypeSortie` | oui | `VENTE` `PERTE` `DON` `RETOUR_FOURNISSEUR` |
| `notes` | string | non | — |
| `lignes` | array | oui | min 1 élément |
| `lignes[].varianteId` | string (uuid) | oui | — |
| `lignes[].quantite` | integer ≥ 1 | oui | — |
| `lignes[].prixUnitaire` | string decimal | oui | ex : `"12500.00"` |

> **Note :** Si le stock est insuffisant, retourne `400` avec `code: "STOCK_NEGATIVE_FORBIDDEN"`.

**Réponse 201 :** objet `Sortie` complet avec lignes.

---

### PATCH `/sorties/:id/annuler`
Annule une sortie. Génère des mouvements `RETOUR` pour réintégrer le stock.

**Réponse 200 :** objet `Sortie` annulé.

---

## 8. Caisse

### GET `/caisse/sessions`
Liste paginée des sessions de caisse.

**Query params :** `page`, `limit`, `dateDebut`, `dateFin`, `modePaiement`

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "dateOuverture": "2026-06-16T08:00:00.000Z",
      "dateFermeture": null,
      "montantOuverture": "100000.00",
      "montantFermeture": null,
      "statut": "OUVERTE",
      "user": { "email": "admin@shop.com" }
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "pageCount": 1 }
}
```

---

### GET `/caisse/sessions/active`
Retourne la session de caisse actuellement ouverte (statut `OUVERTE`).

**Réponse 200 :** objet `Session` ou `null` si aucune session active.

---

### POST `/caisse/sessions/ouvrir`
Ouvre une nouvelle session de caisse.

**Corps :**
```json
{
  "montantOuverture": "100000.00"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `montantOuverture` | string decimal | non | Fonds de caisse initial. Défaut : `"0.00"` |

**Réponse 201 :** objet `Session` créé avec `statut: "OUVERTE"`.

---

### POST `/caisse/sessions/:id/fermer`
Ferme une session de caisse.

**Corps :**
```json
{
  "montantFermeture": "150000.00"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `montantFermeture` | string decimal | oui | Montant compté à la fermeture |

**Réponse 201 :** objet `Session` avec `statut: "FERMEE"` et `dateFermeture` renseignée.

---

### GET `/caisse/sessions/:id/transactions`
Liste les transactions d'une session.

**Query params :** `modePaiement`, `dateDebut`, `dateFin`, `page`, `limit`

**Réponse 200 :**
```json
{
  "data": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "sortieId": "uuid",
      "montant": "12500.00",
      "modePaiement": "WAVE",
      "reference": "TRX-0001",
      "notes": "Paiement comptoir",
      "createdAt": "2026-06-16T10:00:00.000Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "pageCount": 1 }
}
```

---

### POST `/caisse/transactions`
Enregistre une transaction sur la session active.

**Corps :**
```json
{
  "montant": "12500.00",
  "modePaiement": "WAVE",
  "sortieId": "uuid",
  "reference": "TRX-0002",
  "notes": "Paiement mobile"
}
```

| Champ | Type | Requis | Description |
|---|---|---|---|
| `montant` | string decimal | oui | ex : `"12500.00"` |
| `modePaiement` | `ModePaiement` | oui | `CASH` `WAVE` `ORANGE_MONEY` `CARTE` `MTN_MONEY` |
| `sortieId` | string (uuid) | non | Lie la transaction à une sortie |
| `reference` | string | non | Référence externe (ex : numéro Wave) |
| `notes` | string | non | — |

**Réponse 201 :** objet `Transaction` créé.

---

### GET `/caisse/resume-jour`
Résumé financier du jour courant.

**Réponse 200 :**
```json
{
  "session": {
    "id": "uuid",
    "statut": "OUVERTE",
    "montantOuverture": "100000.00",
    "dateOuverture": "2026-06-16T08:00:00.000Z"
  },
  "totalVentes": "37500.00",
  "totalTransactions": 3,
  "parModePaiement": {
    "CASH": "25000.00",
    "WAVE": "12500.00"
  }
}
```

---

## 9. Rapports

> Tous les endpoints rapports acceptent les query params `dateDebut`, `dateFin` (ISO 8601) et `groupBy` (`jour` | `semaine` | `mois`, défaut `jour`).

### GET `/rapports/ventes`
Rapport des ventes groupées par période.

**Réponse 200 :**
```json
[
  {
    "periode": "2026-06-16",
    "totalVentes": "37500.00",
    "nombreTransactions": 3,
    "nombreSorties": 2
  }
]
```

---

### GET `/rapports/stock-valeur`
Valeur totale du stock (prix achat × quantité).

**Réponse 200 :**
```json
{
  "valeurTotaleAchat": "850000.00",
  "valeurTotaleVente": "1250000.00",
  "nombreVariantes": 6,
  "nombreProduits": 4
}
```

---

### GET `/rapports/top-produits`
Top 10 des produits les plus vendus sur la période.

**Réponse 200 :**
```json
[
  {
    "produitId": "uuid",
    "nom": "T-shirt Premium",
    "sku": "TSH-001",
    "quantiteTotale": 45,
    "montantTotal": "562500.00"
  }
]
```

---

### GET `/rapports/flux-tresorerie`
Flux de trésorerie (entrées vs sorties d'argent).

**Réponse 200 :**
```json
[
  {
    "periode": "2026-06-16",
    "entrees": "124000.00",
    "sorties": "37500.00",
    "solde": "-86500.00"
  }
]
```

---

### GET `/rapports/export/excel`
Exporte le rapport en fichier Excel.

**Réponse 200 :**  
`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`  
`Content-Disposition: attachment; filename="rapport-ventes.xlsx"`  
Corps : buffer binaire `.xlsx`

---

### GET `/rapports/export/pdf`
Exporte le rapport en fichier PDF.

**Réponse 200 :**  
`Content-Type: application/pdf`  
`Content-Disposition: attachment; filename="rapport-ventes.pdf"`  
Corps : buffer binaire `.pdf`

---

## Codes d'erreur métier

| Code | HTTP | Description |
|---|---|---|
| `VARIANTE_NOT_FOUND` | 400 | Variante inexistante |
| `STOCK_NEGATIVE_FORBIDDEN` | 400 | Stock insuffisant pour la sortie |
| `STOCK_NOOP` | 400 | Ajustement de variation = 0 |
| `UNAUTHORIZED` | 401 | Token absent ou invalide |
| `FORBIDDEN` | 403 | Rôle insuffisant |
| `NOT_FOUND` | 404 | Ressource introuvable |

**Format d'erreur :**
```json
{
  "statusCode": 400,
  "message": "Stock insuffisant pour cette variante",
  "error": "Bad Request",
  "code": "STOCK_NEGATIVE_FORBIDDEN",
  "details": {
    "varianteId": "uuid",
    "stockActuel": 1,
    "quantiteDemandee": 5
  }
}
```

---

## Flux d'intégration typiques

### Flux vente complète
1. `POST /auth/login` → récupérer `accessToken`
2. `GET /stock?alerte=false` → choisir les variantes disponibles
3. `POST /sorties` → créer la sortie (type `VENTE`, avec les lignes)
4. `POST /caisse/transactions` → enregistrer le paiement lié à la `sortieId`

### Flux approvisionnement
1. `GET /produits` → identifier les produits à réapprovisionner
2. `GET /stock/alertes` → voir les variantes critiques
3. `POST /entrees` → créer l'entrée avec les lignes

### Flux ouverture/fermeture caisse
1. `POST /caisse/sessions/ouvrir` → `{ "montantOuverture": "100000.00" }`
2. *(journée de ventes)*
3. `GET /caisse/resume-jour` → vérifier le récapitulatif
4. `POST /caisse/sessions/:id/fermer` → `{ "montantFermeture": "185000.00" }`
