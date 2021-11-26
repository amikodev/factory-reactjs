import { combineReducers } from 'redux';

import Equipments from '../Equipments';

// import selCoord from './selCoord';
// import gcode from './gcode';

import cncRouter from './cncRouter';
import cnc5AxisRouter from './cnc5AxisRouter';

import reducerDefault from './reducerDefault';

// let reducerList = {
//     selCoord, gcode
// };

const reducerInit = (equipmentItems) => {
    // console.log({equipmentItems});
    let list = {};
    equipmentItems.forEach((item) => {
        let name = item.name;
        let reducer = reducerDefault;
        switch(item.type){
            case Equipments.TYPE_CNC_ROUTER:
                reducer = cncRouter;
                break;
            case Equipments.TYPE_CNC_5_AXIS_ROUTER:
                reducer = cnc5AxisRouter;
                break;
            default:
                break;
        }
        list[name] = reducer;
    });
    // return combineReducers(reducerList);
    return combineReducers(list);
}

export default reducerInit;

// export default combineReducers({
//     selCoord, gcode
// });
