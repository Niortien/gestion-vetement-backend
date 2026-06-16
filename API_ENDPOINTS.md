# Documentation API - Gestion Stock & Caisse

Base URL: `/api/v1`

## Format global des reponses

Toutes les reponses JSON standard sont enveloppees par l'interceptor global:

```json
{
  "data": {},
  "meta": null,
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

Pour les endpoints pagines, `meta` contient:

```json
{
  "total": 120,
  "page": 1,
  "limit": 20,
  "pageCount": 6
}
```

## Format global des erreurs

```json
{
  "error": {
    "code": "BUSINESS_ERROR_CODE",
    "message": "Message explicite",
    "details": {}
  },
  "path": "/api/v1/...",
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

## Authentification

- Header pour routes protegees:
  - `Authorization: Bearer <accessToken>`
- Access token: 15 minutes
- Refresh token: 7 jours

---

## 1) AUTH

### POST /auth/login
- Auth: Non
- Body:

```json
{
  "email": "admin@shop.com",
  "password": "StrongPass123!"
}
```

- Reponse 201:

```json
{
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "user": {
      "id": "uuid",
      "email": "admin@shop.com",
      "role": "ADMIN"
    }
  },
  "meta": null,
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

### POST /auth/refresh
- Auth: Non
- Body:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

- Reponse 201:

```json
{
  "data": {
    "accessToken": "new_jwt_access_token"
  },
  "meta": null,
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

### POST /auth/logout
- Auth: Non
- Body: aucun
- Reponse 201:

```json
{
  "data": {
    "success": true
  },
  "meta": null,
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

---

## 2) PRODUITS

### GET /produits
- Auth: Oui
- Query:
  - `page`, `limit`, `sortBy`, `sortOrder`
  - `categorieId` (string)
  - `search` (string)
  - `isActif` (boolean)
- Reponse 200: page de produits

### GET /produits/:id
- Auth: Oui
- Param:
  - `id` (uuid)
- Reponse 200: produit avec `variantes` et `categorie`

### POST /produits
- Auth: Oui
- Body:

```json
{
  "nom": "T-shirt Premium",
  "sku": "VET-TSH-1720000000",
  "description": "Coton bio",
  "categorieId": "uuid",
  "prixVente": "12500.00",
  "prixAchat": "8000.00",
  "imageUrl": "https://cdn.example.com/p1.jpg",
  "variantes": [
    {
      "taille": "M",
      "couleur": "Noir",
      "quantiteStock": 30,
      "seuilAlerte": 5
    }
  ]
}
```

- Notes:
  - `sku` est optionnel (auto-genere si absent)
  - montants en string decimal

### PATCH /produits/:id
- Auth: Oui
- Param:
  - `id` (uuid)
- Body partiel:

```json
{
  "nom": "T-shirt Premium v2",
  "prixVente": "13000.00",
  "isActif": true
}
```

### DELETE /produits/:id
- Auth: Oui
- Param:
  - `id` (uuid)
- Effet:
  - soft delete (`isActif = false`)

### GET /produits/:id/mouvements
- Auth: Oui
- Param:
  - `id` (uuid)
- Query:
  - `page`, `limit`
- Reponse 200: page de mouvements de stock lies au produit

---

## 3) VARIANTES

### PATCH /variantes/:id
- Auth: Oui
- Param:
  - `id` (uuid)
- Body partiel:

```json
{
  "taille": "L",
  "couleur": "Blanc",
  "seuilAlerte": 7
}
```

### PATCH /variantes/:id/stock
- Auth: Oui
- Param:
  - `id` (uuid)
- Body:

```json
{
  "variation": -2,
  "motif": "Ajustement inventaire"
}
```

- Regle metier:
  - si le stock devient negatif => erreur 422

---

## 4) STOCK

### GET /stock
- Auth: Oui
- Query:
  - `page`, `limit`, `sortBy`, `sortOrder`
  - `alerte` (boolean)
  - `taille` (XS|S|M|L|XL|XXL|XXXL)
  - `couleur` (string)
  - `categorieId` (string)
- Reponse 200: page de variantes avec stock actuel

### GET /stock/alertes
- Auth: Oui
- Reponse 200: variantes sous seuil d'alerte

### GET /stock/mouvements
- Auth: Oui
- Query:
  - `page`, `limit`, `sortBy`, `sortOrder`
  - `type` (ENTREE|SORTIE|AJUSTEMENT|RETOUR)
  - `dateDebut` (ISO)
  - `dateFin` (ISO)
  - `produitId` (uuid)
- Reponse 200: page de mouvements

---

## 5) ENTREES

### GET /entrees
- Auth: Oui
- Query:
  - `page`, `limit`, `sortBy`, `sortOrder`
  - `dateDebut` (ISO)
  - `dateFin` (ISO)
  - `fournisseur` (string)
- Reponse 200: page d'entrees

### GET /entrees/:id
- Auth: Oui
- Param:
  - `id` (uuid)
- Reponse 200: entree + lignes

### POST /entrees
- Auth: Oui
- Body:

```json
{
  "fournisseur": "Grossiste Dakar",
  "notes": "Livraison juin",
  "lignes": [
    {
      "varianteId": "uuid",
      "quantite": 20,
      "prixUnitaire": "5000.00"
    }
  ]
}
```

- Regle metier:
  - creation entree + lignes + mouvements ENTREE dans une transaction Prisma

### PATCH /entrees/:id/annuler
- Auth: Oui
- Param:
  - `id` (uuid)
- Regle metier:
  - annulation avec mouvements inverses

---

## 6) SORTIES

### GET /sorties
- Auth: Oui
- Query:
  - `page`, `limit`, `sortBy`, `sortOrder`
  - `type` (VENTE|PERTE|DON|RETOUR_FOURNISSEUR)
  - `dateDebut` (ISO)
  - `dateFin` (ISO)
- Reponse 200: page de sorties

### GET /sorties/:id
- Auth: Oui
- Param:
  - `id` (uuid)

### POST /sorties
- Auth: Oui
- Body:

```json
{
  "type": "VENTE",
  "notes": "Vente boutique",
  "lignes": [
    {
      "varianteId": "uuid",
      "quantite": 1,
      "prixUnitaire": "12500.00"
    }
  ]
}
```

- Regles metier:
  - type `VENTE` exige une session de caisse ouverte
  - creation sortie + lignes + mouvements SORTIE atomique
  - stock negatif interdit (422)

### PATCH /sorties/:id/annuler
- Auth: Oui
- Param:
  - `id` (uuid)
- Regle metier:
  - annulation avec mouvements RETOUR

---

## 7) CAISSE

### GET /caisse/sessions
- Auth: Oui
- Query:
  - `page`, `limit`, `sortBy`, `sortOrder`

### GET /caisse/sessions/active
- Auth: Oui
- Reponse 200: session ouverte du jour ou `null`

### POST /caisse/sessions/ouvrir
- Auth: Oui
- Body:

```json
{
  "montantOuverture": "100000.00"
}
```

- Regle metier:
  - une seule session ouverte a la fois

### POST /caisse/sessions/:id/fermer
- Auth: Oui
- Param:
  - `id` (uuid)
- Body:

```json
{
  "montantFermeture": "175000.00"
}
```

- Regle metier:
  - fermeture irreversible

### GET /caisse/sessions/:id/transactions
- Auth: Oui
- Param:
  - `id` (uuid)
- Query:
  - `page`, `limit`, `sortBy`, `sortOrder`
  - `modePaiement` (CASH|WAVE|ORANGE_MONEY|CARTE|MTN_MONEY)
  - `dateDebut` (ISO)
  - `dateFin` (ISO)

### POST /caisse/transactions
- Auth: Oui
- Body:

```json
{
  "montant": "12500.00",
  "modePaiement": "WAVE",
  "sortieId": "uuid",
  "reference": "TRX-0001",
  "notes": "Paiement comptoir"
}
```

- Regle metier:
  - impossible sans session ouverte (409)

### GET /caisse/resume-jour
- Auth: Oui
- Reponse 200:

```json
{
  "data": {
    "totalVentes": "120000.00",
    "totalEntrees": "45000.00",
    "totalSorties": "30000.00",
    "soldeActuel": "45000.00",
    "parModePaiement": {
      "CASH": "30000.00",
      "WAVE": "50000.00",
      "CARTE": "40000.00"
    }
  },
  "meta": null,
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

---

## 8) RAPPORTS

### GET /rapports/ventes
- Auth: Oui
- Query:
  - `dateDebut` (ISO)
  - `dateFin` (ISO)
  - `groupBy` (jour|semaine|mois)
- Reponse 200: series temporelles

### GET /rapports/stock-valeur
- Auth: Oui
- Reponse 200:

```json
{
  "data": {
    "valeurStock": "850000.00"
  },
  "meta": null,
  "timestamp": "2026-06-11T12:00:00.000Z"
}
```

### GET /rapports/top-produits
- Auth: Oui
- Query:
  - `dateDebut`, `dateFin`
- Reponse 200: top 10 produits vendus

### GET /rapports/flux-tresorerie
- Auth: Oui
- Query:
  - `dateDebut`, `dateFin`
- Reponse 200: entrees vs sorties caisse

### GET /rapports/export/excel
- Auth: Oui
- Query:
  - `dateDebut`, `dateFin`, `groupBy`
- Reponse:
  - fichier binaire `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### GET /rapports/export/pdf
- Auth: Oui
- Query:
  - `dateDebut`, `dateFin`, `groupBy`
- Reponse:
  - fichier binaire `application/pdf`

---

## 9) WebSocket Caisse (live)

Namespace: `/caisse`

Events emis par le backend:
- `transaction.created`
- `session.closed`

---

## Codes d'erreurs metier importants

- `409 CONFLICT`
  - `NO_ACTIVE_SESSION`
  - `SESSION_REQUIRED_FOR_VENTE`
  - `SESSION_ALREADY_OPEN`
  - `SESSION_CLOSED`
- `422 UNPROCESSABLE ENTITY`
  - `STOCK_NEGATIVE_FORBIDDEN`
  - `AUTH_INVALID_CREDENTIALS`
  - `VARIANTE_NOT_FOUND`
- `404 NOT FOUND`
  - `PRODUIT_NOT_FOUND`
  - `ENTREE_NOT_FOUND`
  - `SORTIE_NOT_FOUND`
  - `USER_NOT_FOUND`

---

## Exemples front-end (resume)

1. Login:
   - `POST /api/v1/auth/login`
   - stocker `accessToken` + `refreshToken`
2. Appels proteges:
   - header `Authorization: Bearer <accessToken>`
3. Refresh token:
   - `POST /api/v1/auth/refresh` si 401
4. Pagination:
   - lire `meta.total`, `meta.page`, `meta.pageCount`
