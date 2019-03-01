# 1 Organisation du code
Actuellement, on a du mal à comprendre l'organisation du code - bien que la refonte de l'organisation des répertoires ait aidée. Problèmes que cela pose :
- compréhension générale du framework
- pas d'isolation fonctionnelle (voir 2)
- redondance de code (voir 3)

# 2 Manque d'isolation fonctionnelle.
Les fonctionnalités ne sont pas cloisonnées. Par exemple, une partie de la logique du router se retrouve dans SIBDisplay. Cela pose principalement trois soucis :
- manque de pattern pour ajouter des fonctionnalités
- maintenabilité
- testabilité

Proposition : Améliorer le système de mixins (voir B)

# 3 Redondance du code
Actuellement, il y a, par exemple, plusieurs composants qui implémente la manière dont on fait le rendu. Problèmes que cela pose :
- évolutabilité (par exemple, si un jour on veut faire du shadow DOM)
- maintenabilité

Proposition : One class responsability (voir A)

# 4 Manque de pattern
De manière générale, le framework manque de normalisation. Notamment :
- Développement de feature (voir 2)
- Chemin des données (voir 5)
- Normalisation des événéments (voir 9)

# 5 Chemin des données
Actuellement, on peut avoir des données issues des attributs, des données qui sont liées à l'état du composant (par ex SIBDisplay) et des données qui sont fournie ou prise par des parents (par exemple, les mixins). Ca rend compliqué le débugage de l'app.

Proposition :
- Normaliser le chemin des données : assez classiquement, on peut convenir que la données descends exclusivement. Pour la faire remonter, passer par des événements.
- Rendre les données utilisées par le composant explicites (voir C)

# 6 Lifecycle
Actuellement, on utilise les callbacks des customs elements. Problèmes que cela pose :
- on a que 2 callbacks (connected/disconnected)
- comme on utilise l'héritage, on est obligé de faire d'utiliser super pour appelé les callbacks en cascade, avec possiblement des effets de bords
- pas de normalisation du cycle de vie du composant

Proposition : Créer un système de hooks (voir E)

# 7 Moteur de rendu
Le moteur de rendu, au delà d'être éclaté (voir 2), s'appuie sur deux choses :
- l'utilisation de innerHTML
- l'utilisation d'eval

Tout d'abord, cela nous oblige à rerendre l'ensemble de l'élément si une données évolue donc niveau performance c'est pas l'idéal (voir 8).
Ensuite, les fonctionnalités de templating reste "basique" : on affiche une valeur et c'est tout (pas de if, pas de loop, etc...). Enfin, il vaut mieux éviter d'utiliser un eval.

Propositions :
 - Avoir un système de templating un peu plus poussé (voir D)
 - Constuire un moteur de rendu (voir H)

# 8 Réactivité
Actuellement, on ne gère pas bien la mise à jour de données qui sont mises à jour. D'une part, on fait le rendu intégral à chaque fois (voir 7). D'autre part, on a pas de système pour surveiller les données et déclencher le rendu de manière automatique (voir 5).

Proposition : Créer un système de state qui surveille les données et notifie de tout changement (voir F)

# 9 Store
En attendant la réécriture du store, on a de sérieux problèmes de performances (redondance de requêtes notamment). De plus, certains éléments liés au store se retrouve dans le code, exemple :
```
if (propertyValue['ldp:contains']) {
  //
}
```
Proposition: Créer un wrapper autour du store (voir G)

# A Séparer les responsabilités
Permettre de connaître la responsabilité unique d'une classe. Voici la proposition de découpage :
- Element : le custom element
- Renderer : le système de rendu (voir D, H)
- State : le système de données réactives (voir F)
- Store : le store :) (voir G)
- Component : l'orchestrateur autour des 4 autres éléménts. C'est lui qui porte la composition des mixins ( voir B)
- SIB : Construit et enregistre les composants

# B Améliorer le système de mixins
Permettre aux composants d'installer des mixins facilement via l'ajout d'une méthode statique use qui renvoie une tableau de mixins à installer.

Exemple :
```
static get use() {
  return [
    MyAwesomeMixin,
  ]
}
```

Toutes les fonctionnalités qui ne sont pas utilisées partout doivent être mises dans un mixin (Router, Loader, etc.).

# C Component data property
Pour nourrir un composant avec des données, elles doivent être passées comme attribut de l'élément. Avant :
```
<sib-display data-src="https://test-paris.happy-dev.fr/users/" data-fields="@id, username, first_name, last_name, email">
  <sib-display data-fields="@id, username, first_name, last_name, email"></sib-display>
  ...
</sib-display>
```

Après :
```
<sib-display data-src="https://test-paris.happy-dev.fr/users/" data-fields="@id, username, first_name, last_name, email">
  <sib-display data-fields="@id, username, first_name, last_name, email" data-src="https://test-paris.happy-dev.fr/users/1/"></sib-display>
  ...
</sib-display>
```

Ainsi, l'élément "fils" peut être sorti de la boucle, il sera toujours utilisable. De la même manière, les widgets doivent recevoir la valeur via un attribut et s'ils doivent la mettre à jour, passer par un événement (voir 5)

# D Système de templating
Si on veut pouvoir se passer d'un eval et du innerHTML (voir 7), il faut mettre en place un système de templating.

Ce système doit permettre de mettre à jour les données qui ont changées sans avoir à faire tout le rendu une nouvelle fois.

Propositions de "mot-clé" :
- sib-value : met la valeur dans textContent de l'élément cible
- sib-attribute : met la valeur dans l'attribut cible.
- sib-if: évalue s'il faut rendre l'élément ou pas
- sib-for: itère l'élément
- etc.

Proposition 2 : utilisation des slots

Le mieux serait de séparer chaque mot clé et les injecter dans le renderer.

# E Hooks
Création de hooks normalisés.

Hooks :
- created : called when the component constructor is called
- attached: called when the component is attached to DOM
- rendered : called when the component is first rendered
- attributeChanged : called when the component's attribute is mutated
- dataChanged: called when a property is mutated
- updated: called when component DOM is updated
- detached: called when component is detached from DOM

# F State
- Autobinding des attributs DOM - exemple : "my-attribute" => this.myAttribute
- Enregistrement à la demande de données réactive - exemple : récupérer des données du store => les lier à l'élément
- Notification de tout changement d'état => permettre d'accrocher des callback à tout changement d'état

Exemple :
- l'événement dataChanged:{prop} est lancé quand {prop} a été modifiée
- accrocher cet événement à un callback via du sucre syntaxique, ex:
```
watchers: {
  prop(newValue, oldValue) {
    // do stuff
  }
}
```

# G Store
Wrapper autour du store pour :
- Commencer à utiliser un this.store au lieu de l'objet store posé sur window : l'objectif est de dire que si jamais on veut mettre en place plusieurs store avec des scopes différents, on a mis en place une méthode qui le permette
- Mettre en cache les réponses et limiter les requêtes
- Normaliser la sortie du store (ex: "ldp:contains" >> array)
- Pouvoir réécrire le store sans se faire peur :)

# H Renderer
```js
get template() {
  // return a template string or a HTMLTemplateElement
}
```
Utiliser exclusivement l'élément template pour mettre en forme le rendu. Si le getter template renvoit un string on la met dans un  de manière à normaliser le retour :

```js
const templateElement = document.createElement('template');
templateElement.innerHTML = template;
```

On stocke le template et pour faire le rendu, on peut faire un appendChild si on utilise le DOM ou passer au shadowDOM si besoin.

Le renderer doit pouvoir gérer des slots sans être en mode shadowDOM.
