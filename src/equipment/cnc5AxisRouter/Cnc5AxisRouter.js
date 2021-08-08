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
            posX: 0,
            posY: 0,
            posZ: 0,
            angleA: 0,
            angleC: 0
        }

    }

    handleCoordAxeChange(event, axeName, value){
        this.setState({[axeName]: value});
    }

    // handleAngleAChange(event, value){
    //     this.setState({angleA: value});
    // }

    // handleAngleCChange(event, value){
    //     this.setState({angleC: value});
    // }

    componentDidMount(){

    }

    componentWillUpdate(props){

    }

    render(){

        const { item, classes } = this.props;
        const { userZeroPoint, currentPoint } = this.state;

        let inputGcodeID = "cncRouter_"+item.name+"_gcode";

        return (
            <div className={classes.root}>

                <Typography gutterBottom variant="h5" component="h4">
                    {item.caption}
                    <FiberManualRecordIcon style={{fontSize: 'inherit', float: 'left', margin: '3px 5px 0 0', color: Equipments.STATE_CONNECT_COLOR[this.state.wsStateConnect]}} />
                </Typography>


                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={5} lg={4}>
                        <Simulation 
                            A={this.state.angleA}
                            C={this.state.angleC}
                            X={this.state.posX}
                            Y={this.state.posY}
                            Z={this.state.posZ}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>

                        X
                        <Slider 
                            defaultValue={0} aria-labelledby="discrete-slider-always" valueLabelDisplay="on"
                            value={this.state.posX} min={-4} max={4} step={0.1}
                            onChange={(e, v) => this.handleCoordAxeChange(e, 'posX', v)}
                        /> <br/>

                        Y
                        <Slider 
                            defaultValue={0} aria-labelledby="discrete-slider-always" valueLabelDisplay="on"
                            value={this.state.posY} min={-4} max={4} step={0.1}
                            onChange={(e, v) => this.handleCoordAxeChange(e, 'posY', v)}
                        /> <br/>

                        Z
                        <Slider 
                            defaultValue={0} aria-labelledby="discrete-slider-always" valueLabelDisplay="on"
                            value={this.state.posZ} min={-4} max={4} step={0.1}
                            onChange={(e, v) => this.handleCoordAxeChange(e, 'posZ', v)}
                        /> <br/>

                        A
                        <Slider 
                            defaultValue={0} aria-labelledby="discrete-slider-always" valueLabelDisplay="on"
                            value={this.state.angleA} min={-135} max={135}
                            onChange={(e, v) => this.handleCoordAxeChange(e, 'angleA', v)}
                        /> <br/>

                        C
                        <Slider 
                            defaultValue={0} aria-labelledby="discrete-slider-always" valueLabelDisplay="on"
                            value={this.state.angleC} min={-180} max={180}
                            onChange={(e, v) => this.handleCoordAxeChange(e, 'angleC', v)}
                        /> <br/>

                        <br/>
                        <br/>


                        <button style={{
                            fontSize: 20, width: 120
                        }} onClick={e => {
                            this.setState({angleA: 0, angleC: 0, posX: 0, posY: 0, posZ: 0});
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

const mapStateToProps = (state) => {
    return {

    };
};

const mapDispatchToProps = (dispatch) => {
    return {

    };
};

// export default CncRouter;
// export default connect(mapStateToProps, mapDispatchToProps)(withStyles(useStyles)(Cnc5AxisRouter));
// console.log( connect(mapStateToProps, mapDispatchToProps) );
// export default connect(mapStateToProps, mapDispatchToProps)(Cnc5AxisRouter);
export default withStyles(useStyles)(Cnc5AxisRouter);

export {


};
