/*
amikodev/factory-reactjs - Industrial equipment management with ReactJS
Copyright © 2020 Prihodko Dmitriy - asketcnc@yandex.ru
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

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
// import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
// import Paper from '@material-ui/core/Paper';
// import Tooltip from '@material-ui/core/Tooltip';
// import Snackbar from '@material-ui/core/Snackbar';
// import LinearProgress from '@material-ui/core/LinearProgress';
import Slider from '@material-ui/core/Slider';


import { AppContext } from '../../AppContext';

import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({
    root: {
        '& .MuiButton-root': {
            margin: theme.spacing(1),
        },
        '& .MuiSlider-root': {
            margin: theme.spacing(1),
            marginTop: theme.spacing(7),
        },

    },
    btnEngine: {
        '& .MuiButton-root': {
            // margin: theme.spacing(1),
            width: '100%',
        },
    },
});



const OBJ_NAME_ENGINE = 0x50;
const OBJ_NAME_FREQ = 0x51;
// const OBJ_NAME_DIRECTION = 0x52;

// const CMD_READ = 0x01;
const CMD_WRITE = 0x02;

const ENGINE_STATE_RUN = 0x01;
const ENGINE_STATE_STOP = 0x02;



class FreqConverter extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.setFreq = this.setFreq.bind(this);

        this.state = {
            freqValue: 0,
        };

    }

    handleEngineRunClick(event){
        const { wsPrepareData } = this.context;
        const { item } = this.props;

        let data = [OBJ_NAME_ENGINE, CMD_WRITE, ENGINE_STATE_RUN];

        let ws = window.Equipments.getItemWs(item.name);
        console.log(wsPrepareData( data ));
        // ws.send(wsPrepareData(data));
    }

    handleEngineStopClick(event){
        const { wsPrepareData } = this.context;
        const { item } = this.props;

        let data = [OBJ_NAME_ENGINE, CMD_WRITE, ENGINE_STATE_STOP];

        let ws = window.Equipments.getItemWs(item.name);
        console.log(wsPrepareData( data ));
        // ws.send(wsPrepareData(data));
    }


    setFreq(value){
        const { wsPrepareData } = this.context;
        const { item } = this.props;

        console.log('setFreq', value);

        this.setState({freqValue: value});

        value *= 10;

        let data = [OBJ_NAME_FREQ, CMD_WRITE, (value >> 8) & 0xFF, (value) & 0xFF];

        let ws = window.Equipments.getItemWs(item.name);
        console.log(wsPrepareData( data ));
        // ws.send(wsPrepareData(data));

    }

    handleFreqChange(event, value){
        // const { item } = this.props;

        // console.log(value);
        this.setFreq(value);
    }

    render(){

        const { item, classes } = this.props;

        const freqMarks = [
            {value: 0, label: '0'},
            {value: 10, label: '10'},
            {value: 20, label: '20'},
            {value: 30, label: '30'},
            {value: 40, label: '40'},
            {value: 50, label: '50'},
            {value: 60, label: '60'},
            {value: 70, label: '70'},
            {value: 80, label: '80'},
            {value: 90, label: '90'},
        ];

        const freqValueText = value => {
            return value;
        }

        return (
            <div className={classes.root}>

                <Typography gutterBottom variant="h5" component="h4">
                    {item.caption}
                </Typography>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <div className={classes.btnEngine}>
                            <Button variant="contained" onClick={e => this.handleEngineRunClick(e)}>{('Запустить двигатель')}</Button>
                            <Button variant="contained" onClick={e => this.handleEngineStopClick(e)}>{('Остановить двигатель')}</Button>
                        </div>
                        <Slider 
                            value={this.state.freqValue}
                            // defaultValue={0}
                            getAriaValueText={freqValueText}
                            aria-labelledby="discrete-slider-always"
                            // step={5}
                            marks={freqMarks}
                            valueLabelDisplay="on"
                            max={90}
                            onChangeCommitted={(e, v) => this.handleFreqChange(e, v)}
                        />

                    </Grid>
                    <Grid item xs={12} md={3}>
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90].map(v => 
                            <Button variant="contained" onClick={e => this.setFreq(v)} key={v}>{v}</Button>
                        )}
                    </Grid>
                </Grid>

            </div>
        );
    }

}

FreqConverter.defaultProps = {
    item: {},                   // свойства оборудования
};

export default withStyles(useStyles)(FreqConverter);
