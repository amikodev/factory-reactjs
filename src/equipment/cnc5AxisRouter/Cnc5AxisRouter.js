/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2021 Prihodko Dmitriy - asketcnc@yandex.ru
*/

/*
This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.
You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import React from 'react';
import { connect } from 'react-redux';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';

import {AppContext} from '../../AppContext';

import Simulation from './Simulation';

// import GCode from '../GCode';
// import { letterCodes } from '../GCode';
// import { COORD_SYSTEM_NULL, COORD_SYSTEM_USER } from '../GCode';


import { withStyles } from '@material-ui/core/styles';
import Equipments from '../../Equipments';
const useStyles = theme => ({
    root: {
        '& .MuiButton-root': {
            margin: theme.spacing(1),
        },
        '& .MuiSlider-root': {
            marginBottom: -theme.spacing(1),
            marginTop: theme.spacing(5),
            marginLeft: theme.spacing(2),
            width: '80%',
        },

    },

});

/**
 * 5 осевой ЧПУ станок
 */
class Cnc5AxisRouter extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);


        this.state = {

        }

    }

    handleCoordAxeChange(event, axeName, value){
        this.props.onCoord(axeName, value);
    }

    componentDidMount(){

    }

    componentWillUpdate(props){

    }

    render(){

        const { item, classes } = this.props;
        const { userZeroPoint, currentPoint } = this.state;

        let inputGcodeID = "cncRouter_"+item.name+"_gcode";

        const axeSettings = {
            X: {min: -4, max: 4, step: 0.1},
            Y: {min: -4, max: 4, step: 0.1},
            Z: {min: -4, max: 4, step: 0.1},
            A: {min: -135, max: 135, step: 1},
            C: {min: -180, max: 180, step: 1},
        };

        return (
            <div className={classes.root}>

                <Typography gutterBottom variant="h5" component="h4">
                    {item.caption}
                    <FiberManualRecordIcon style={{fontSize: 'inherit', float: 'left', margin: '3px 5px 0 0', color: Equipments.STATE_CONNECT_COLOR[this.state.wsStateConnect]}} />
                </Typography>


                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={5} lg={4}>
                        <Simulation
                            X={this.props.coordX}
                            Y={this.props.coordY}
                            Z={this.props.coordZ}
                            A={this.props.coordA}
                            B={this.props.coordC}
                            C={this.props.coordC}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>

                        {Object.keys(axeSettings).map(axeName => {
                            let axe = axeSettings[axeName];
                            return (
                                <React.Fragment key={axeName}>
                                    {axeName}
                                    <Slider 
                                        aria-labelledby="discrete-slider-always" valueLabelDisplay="on"
                                        value={this.props['coord'+axeName]} min={axe.min} max={axe.max} step={axe.step}
                                        onChange={(e, v) => this.handleCoordAxeChange(e, axeName, v)}
                                    /> <br/>
                                </React.Fragment>
                            );
                        })}

                        <br/>
                        <br/>


                        <button style={{
                            fontSize: 20, width: 120
                        }} onClick={e => {
                            const { onCoords } = this.props;
                            onCoords({X: 0, Y: 0, Z: 0, A: 0, B: 0, C: 0});
                        }}>Reset</button>


                    </Grid>
                    <Grid item xs={12} sm={3} md={2}>
                        
                    </Grid>
                </Grid>



                </div>
        );
    }

}

Cnc5AxisRouter.defaultProps = {
    item: {},                   // свойства оборудования
};


const reducerMaps = (item) => {

    const mapStateToProps = (state) => {
        let st = state[item.name];
        // console.log({name: item.name, state, st});
        return {
            coordX: st.coordX,
            coordY: st.coordY,
            coordZ: st.coordZ,
            coordA: st.coordA,
            coordB: st.coordB,
            coordC: st.coordC,
        };
    };
    
    const mapDispatchToProps = (dispatch) => {
        return {
            onCoord: (name, value) => { dispatch({type: 'COORD_'+name, payload: value}) },
            onCoords: (coords) => { Object.keys(coords).map(name => { dispatch({type: 'COORD_'+name, payload: coords[name]}); }) },
        };
    };
    
    return {mapStateToProps, mapDispatchToProps};
};


export default withStyles(useStyles)(Cnc5AxisRouter);

export {
    reducerMaps,

};