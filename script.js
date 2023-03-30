'use strict';

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // very bad practice for creating id
  clicks = 0; // Counting number of clicks
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // km
    this.duration = duration; // min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}
    `;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = (this.duration / this.distance).toFixed(1);
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain; // min/km
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = (this.distance / (this.duration / 60)).toFixed(1); // km/hr
  }
}

const run1 = new Running([39, -12], 5.2, 24, 178);
const cycling1 = new Cycling([39, -12], 27, 95, 523);

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
// APPLICATION INTERFACE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;
  constructor() {
    this._getPosition();

    // get data from local storage:
    this._getLocalStorage();

    // Submitting the form:
    form.addEventListener('submit', this._newWorkout.bind(this));

    // toggling elevation field:
    inputType.addEventListener('change', this._toggleElevationField.bind(this));

    // Moving to the clicked workout on map:
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
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
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    // An object of type e is stored in map
    // console.log(map); // e {options: {…}, _handlers: Array(7), _layers: {…}, _zoomBoundLayers: {…}, _sizeChanged: false, …}

    // `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}.png` => A style for the map loading

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map:
    this.#map.on('click', this._showForm.bind(this));

    // Rendering the marker from local storage:
    this.#workouts.forEach(work => this._renderWorkoutMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    // removing hidden class
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // Hide the form:
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 500);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Preventing default reload:
    e.preventDefault();

    // Get data from the form:
    const { lat, lng } = this.#mapEvent.latlng;
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    // Helper functions:
    const isDataNumber = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    const isPositive = (...inputs) => inputs.every(inp => inp > 0);

    // Running:
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if data is valid:
      if (
        //: !Number.isFinite(distance) ||
        //: !Number.isFinite(duration) ||
        //: !Number.isFinite(cadence)
        !isDataNumber(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be a positive number');
      }
      // Creating a running object:
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // Cycling:
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if data is valid:
      if (
        !isDataNumber(distance, duration, elevation) ||
        !isPositive(distance, duration)
      ) {
        return alert('Inputs have to be a positive number');
      }
      // Creating a cycling object:
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);
    console.log(workout);

    // Render workout on map as marker:
    this._renderWorkoutMarker(workout);

    // Render wokout on list
    this._renderWorkout(workout);

    // Clear input field + hide form:
    this._hideForm();

    // Set local storage to store all workouts:
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    // here WE have called the function and it is not a callback function of any other function => No need to use bind
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>
    `;

    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed}</span>
          <span class="workout__unit">km/hr</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰️</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;
    }

    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEle = e.target.closest('.workout');
    console.log(workoutEle);

    if (!workoutEle) return;

    const workout = this.#workouts.find(
      ({ id }) => id === workoutEle.dataset.id
    );
    console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // Using pubkic interface to count clicks:
    // workout.click();
    // Won't work when local storage added because once converted back to object from string => It loses the prototype chain.
    // ? We can overcome this by looping over the data obtained from converting string to object and making objects of it from class. Do it from _newWorkout => We already have the object, we just need to call the methods starting from pushing into the array of this.#workouts.
  }

  _setLocalStorage() {
    localStorage.setItem('workout', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workout'));
    console.log(data);

    if (!data) return;

    // Extract data from local storage:
    this.#workouts = data;
    // Loop over the value and generate list.
    this.#workouts.forEach(work => this._renderWorkout(work));
  }

  reset() {
    // A public method to clear local storage
    localStorage.removeItem('workout');
    location.reload(); // location is abig object given by browser => it gives us teh ability to reload the page.
  }
}

const app = new App();
