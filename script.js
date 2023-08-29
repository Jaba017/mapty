
// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                       lecture
class Workout {
    date = new Date();
    id = (Date.now() + '').slice(-10);
    clicks = 0;


    constructor(coords, distance, duration) {
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }
    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
    click() {
        this.clicks++;
    }
}
////////////////////////////////////////////////////////////////////////////////////////

class Running extends Workout {
    type = 'running';
    constructor(coords, distance, duration, cadence) {
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }
    calcPace() {
        this.pace = this.duration / this.distance;
        return this.pace
    }
}
//////////////////////////////////////////////////////////////////////////////////////////

class Cycling extends Workout {
    type = 'cycling';
    constructor(coords, distance, duration, elevationGain) {
        super(coords, distance, duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }
    calcSpeed() {
        this.speed = this.distance / (this.duration / 60)
        return this.speed
    }
}

/*
const run1 = new Running([49, 48], 6.2, 10, 178);
const cycl1 = new cycling([49, 48], 30, 100, 178);
console.log(run1, cycl1);
*/
//////////////////////////////////////////////////////////////////////////////////////////
class App {
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];

    constructor() {
        this._getPosition();

        this._getLocalStorage();

        // attach event handlers
        form.addEventListener('submit', this._newWorkout.bind(this));

        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function () {
                alert('your location not exist')
            });
    }

    _loadMap(position) {
        {
            const { latitude } = position.coords;
            const { longitude } = position.coords;
            const coords = [latitude, longitude];

            this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

            this.#map.on('click', this._showForm.bind(this));

            this.#workouts.forEach(work => {
                this._renderWorckoutMarker(work);
            });
        }
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();

    }
    _hideForm() {
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = '';
        form.style.display = "none";
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'), 1000);
    }
    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e) {
        const validInputs = (...inputs) =>
            inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault();
        //// მონაცემების ამოღება form-იდან
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const { lat, lng } = this.#mapEvent.latlng;
        let workout;
        //// if workout runnung,create running object
        if (type === 'running') {
            const cadence = +inputCadence.value;

            // Check if data is valid
            if (
                // !Number.isFinite(distance) ||
                // !Number.isFinite(duration) ||
                // !Number.isFinite(cadence)
                !validInputs(distance, duration, cadence) ||
                !allPositive(distance, duration, cadence)
            )
                return alert('Inputs have to be positive numbers! or complete a all forms.');
            workout = new Running([lat, lng], distance, duration, cadence);
        }
        //// if workout cycling,create cycling object
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            if (!validInputs(distance, duration, elevation) ||
                !allPositive(distance, duration))
                return alert('Inputs have to be positive numbers! or complete a all forms!');
            workout = new Cycling([lat, lng], distance, duration, elevation);

        }

        //// add new object to workout array
        this.#workouts.push(workout);
        // console.log(workout);


        //// render workout on map as marker 
        this._renderWorckoutMarker(workout);

        ////rendet workaut on list 
        this._renderWorkout(workout)

        // შესავსები ცხრილის გაქრობა + ინფუთების გასუფთავება / clear input fields 
        this._hideForm();
        // console.log(this.#mapEvent);

        //set local storage
        this._setLocalStorage();
    }
    // მონიშვნის გამართვა / display marker 
    _renderWorckoutMarker(workout) {
        L.marker(workout.coords)
            .addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`,
            }))
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();
    }
    _renderWorkout(workaut) {
        let html = `
        <li class="workout workout--${workaut.type}" data-id="${workaut.id}">
          <h2 class="workout__title">${workaut.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workaut.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workaut.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workaut.duration}</span>
            <span class="workout__unit">min</span>
          </div>
        `;
        if (workaut.type === 'running')
            html += ` 
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workaut.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workaut.cadence}</span>
            <span class="workout__unit">spm</span>
        </div>
      ` ;
        if (workaut.type === 'cycling')
            html += `
      <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workaut.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workaut.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
          `;
        form.insertAdjacentHTML('afterend', html);
    }
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    _moveToPopup(e) {


        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;

        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
        // workout.click();
    }
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        // console.log(data);

        if (!data) return;

        this.#workouts = data;
        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        })
    }
    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }

}

const app = new App;