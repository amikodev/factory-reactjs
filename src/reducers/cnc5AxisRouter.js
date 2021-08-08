
const defaultState = {
    coordX: 0,
    coordY: 0,
    coordZ: 0,
    coordA: 0,
    coordB: 0,
    coordC: 0,
};

const reducer = (state = defaultState, action) => {

    switch(action.type){
        case 'COORD_X':
            return {...state, coordX: action.payload};
        case 'COORD_Y':
            return {...state, coordY: action.payload};
        case 'COORD_Z':
            return {...state, coordZ: action.payload};
        case 'COORD_A':
            return {...state, coordA: action.payload};
        case 'COORD_B':
            return {...state, coordB: action.payload};
        case 'COORD_C':
            return {...state, coordC: action.payload};
        default:
            return state;
    }

}

export default reducer;
