'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

let map, mapEvent;

class App {
  #map;
  #mapEvent;
  constructor() {
    this._getPosition();

    // Submitting the form:
    form.addEventListener('submit', this._newWorkout.bind(this));

    // toggling elevation field:
    inputType.addEventListener('change', this._toggleElevationField.bind(this));
  }

  _getPosition() {
    navigator.geolocation?.getCurrentPosition(
      this._loadMap.bind(this),
      function () {
        alert(`Could not find the position.`);
      }
    );
  }

  _loadMap(position) {
    // console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    // Creating the array of co-ordinates:
    const coords = [latitude, longitude];

    // Rendering map from leaflet:
    this.#map = L.map('map').setView(coords, 13);

    // An object of type e is stored in map
    // console.log(map); // e {options: {…}, _handlers: Array(7), _layers: {…}, _zoomBoundLayers: {…}, _sizeChanged: false, …}

    // `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png` => A style for the map loading

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map:
    this.#map.on('click', this._showForm.bind(this));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // removing hidden class
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Preventing default reload:
    e.preventDefault();

    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // Adding a marker:
    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('Workout')
      .openPopup();
  }
}

const app = new App();
