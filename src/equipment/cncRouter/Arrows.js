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

import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';


import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';

import {AppContext} from '../../AppContext';

import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({
    arrowMove: {
        clear: 'both',
        '& > .MuiPaper-root': {
            margin: theme.spacing(1),
            width: theme.spacing(7),
            height: theme.spacing(7),
            border: '1px solid rgba(0, 0, 0, 0)',
            float: 'left',
        },
        '& > .MuiPaper-root .MuiButton-root': {
            width: '100%',
            height: '100%',
        },
        '& .MuiButton-root[data-arrow="yp"]': {
            marginTop: theme.spacing(4),
        },
        '& .MuiButton-root[data-arrow="ym"]': {
            marginTop: -theme.spacing(4),
        },
    },
    speedInput: {
        margin: theme.spacing(1),
    },
});


const ARR_XP = 'xp';
const ARR_XM = 'xm';
const ARR_YP = 'yp';
const ARR_YM = 'ym';
const ARR_ZP = 'zp';
const ARR_ZM = 'zm';
const ARR_AP = 'ap';
const ARR_AM = 'am';

class Arrows extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.state = {
            arrow: null,
            speed: 50,
            runAfterLimit: false,
        };

        this.arrowMap = {
            [ARR_XP]: {num: 1, dir: 1},
            [ARR_XM]: {num: 1, dir: 2},
            [ARR_YP]: {num: 2, dir: 1},
            [ARR_YM]: {num: 2, dir: 2},
            [ARR_ZP]: {num: 3, dir: 1},
            [ARR_ZM]: {num: 3, dir: 2},
            [ARR_AP]: {num: 4, dir: 1},
            [ARR_AM]: {num: 4, dir: 2},
        };

        this.timeTest = 0;

    }


    handleArrowMouseDown(event, arrow){
        this.setState({arrow: arrow});
        // console.log(this.arrowMap);
        if(typeof this.props.onArrowDown === 'function'){
            let speed = parseFloat(this.state.speed);
            if(isNaN(speed))
                speed = 1.0;
            this.props.onArrowDown(this.arrowMap[arrow].num, this.arrowMap[arrow].dir, speed, this.state.runAfterLimit);

            // if(arrow == ARR_YP){
            //     this.props.onArrowDown(this.arrowMap[ARR_AP].num, this.arrowMap[ARR_AP].dir, speed, this.state.runAfterLimit);
            // } else if(arrow == ARR_YM){
            //     this.props.onArrowDown(this.arrowMap[ARR_AM].num, this.arrowMap[ARR_AM].dir, speed, this.state.runAfterLimit);
            // }

        }
        this.timeTest = (new Date()).getTime();
        console.log('timeTest', this.timeTest);
    }

    handleArrowMouseUp(event, arrow){
        this.setState({arrow: null});
        if(typeof this.props.onArrowUp === 'function'){
            this.props.onArrowUp(this.arrowMap[arrow].num);

            // if(arrow == ARR_YP){
            //     this.props.onArrowUp(this.arrowMap[ARR_AP].num);
            // } else if(arrow == ARR_YM){
            //     this.props.onArrowUp(this.arrowMap[ARR_AM].num);
            // }

        }
        this.timeTest = (new Date()).getTime();
        console.log('timeTest', this.timeTest);
    }

    handleSpeedChange(event){
        let sp = event.target.value;
        this.setState({speed: sp});
    }

    handleRunAfterLimitChange(event){
        // console.log(event.target.checked);
        this.setState({runAfterLimit: event.target.checked});
    }

    render(){

        const { classes } = this.props;

        return (

            <div>
                <div className={classes.arrowMove}>
                    <Paper variant="outlined">&nbsp;</Paper>
                    <Paper variant="outlined">
                        <Button variant="contained" color={this.state.arrow === ARR_YP ? 'primary' : 'default'} component="span" 
                            onMouseDown={e => this.handleArrowMouseDown(e, ARR_YP)} 
                            onMouseUp={e => this.handleArrowMouseUp(e, ARR_YP)}
                            onTouchStart={e => this.handleArrowMouseDown(e, ARR_YP)}
                            onTouchEnd={e => this.handleArrowMouseUp(e, ARR_YP)}
                            data-arrow={ARR_YP}
                        >
                            <ArrowUpwardIcon />
                            <Typography variant="caption" component="h4">
                                Y+
                            </Typography>
                        </Button>
                    </Paper>
                    <Paper variant="outlined" />
                    <Paper variant="outlined">
                        {/* <Button variant="contained" color="default" component="span" onClick={e => this.handleArrowClick(e, ARR_ZP)}> */}
                        <Button variant="contained" color={this.state.arrow === ARR_ZP ? 'primary' : 'default'} component="span" 
                            onMouseDown={e => this.handleArrowMouseDown(e, ARR_ZP)} 
                            onMouseUp={e => this.handleArrowMouseUp(e, ARR_ZP)}
                            onTouchStart={e => this.handleArrowMouseDown(e, ARR_ZP)}
                            onTouchEnd={e => this.handleArrowMouseUp(e, ARR_ZP)}
                        >
                            <ArrowUpwardIcon />
                            <Typography variant="caption" component="h4">
                                Z+
                            </Typography>
                        </Button>
                    </Paper>
                </div>
                <div className={classes.arrowMove}>
                    <Paper variant="outlined">
                        {/* <Button variant="contained" color="default" component="span" onClick={e => this.handleArrowClick(e, ARR_XM)}> */}
                        <Button variant="contained" color={this.state.arrow === ARR_XM ? 'primary' : 'default'} component="span" 
                            onMouseDown={e => this.handleArrowMouseDown(e, ARR_XM)} 
                            onMouseUp={e => this.handleArrowMouseUp(e, ARR_XM)}
                            onTouchStart={e => this.handleArrowMouseDown(e, ARR_XM)}
                            onTouchEnd={e => this.handleArrowMouseUp(e, ARR_XM)}
                        >
                            <ArrowBackIcon />
                            <Typography variant="caption" component="h4">
                                X-
                            </Typography>
                        </Button>
                    </Paper>
                    <Paper variant="outlined" />
                    <Paper variant="outlined">
                        {/* <Button variant="contained" color="default" component="span" onClick={e => this.handleArrowClick(e, ARR_XP)}> */}
                        <Button variant="contained" color={this.state.arrow === ARR_XP ? 'primary' : 'default'} component="span" 
                            onMouseDown={e => this.handleArrowMouseDown(e, ARR_XP)} 
                            onMouseUp={e => this.handleArrowMouseUp(e, ARR_XP)}
                            onTouchStart={e => this.handleArrowMouseDown(e, ARR_XP)}
                            onTouchEnd={e => this.handleArrowMouseUp(e, ARR_XP)}
                        >
                            <ArrowForwardIcon />
                            <Typography variant="caption" component="h4">
                                X+
                            </Typography>
                        </Button>
                    </Paper>
                    <Paper variant="outlined" />
                </div>
                <div className={classes.arrowMove}>
                    <Paper variant="outlined" />
                    <Paper variant="outlined">
                        {/* <Button variant="contained" color="default" component="span" onClick={e => this.handleArrowClick(e, ARR_YM)}> */}
                        <Button variant="contained" color={this.state.arrow === ARR_YM ? 'primary' : 'default'} component="span" 
                            onMouseDown={e => this.handleArrowMouseDown(e, ARR_YM)} 
                            onMouseUp={e => this.handleArrowMouseUp(e, ARR_YM)}
                            onTouchStart={e => this.handleArrowMouseDown(e, ARR_YM)}
                            onTouchEnd={e => this.handleArrowMouseUp(e, ARR_YM)}
                            data-arrow={ARR_YM}
                        >
                            <ArrowDownwardIcon />
                            <Typography variant="caption" component="h4">
                                Y-
                            </Typography>
                        </Button>
                    </Paper>
                    <Paper variant="outlined" />
                    <Paper variant="outlined">
                        {/* <Button variant="contained" color="default" component="span" onClick={e => this.handleArrowClick(e, ARR_ZM)}> */}
                        <Button variant="contained" color={this.state.arrow === ARR_ZM ? 'primary' : 'default'} component="span" 
                            onMouseDown={e => this.handleArrowMouseDown(e, ARR_ZM)} 
                            onMouseUp={e => this.handleArrowMouseUp(e, ARR_ZM)}
                            onTouchStart={e => this.handleArrowMouseDown(e, ARR_ZM)}
                            onTouchEnd={e => this.handleArrowMouseUp(e, ARR_ZM)}
                        >
                            <ArrowDownwardIcon />
                            <Typography variant="caption" component="h4">
                                Z-
                            </Typography>
                        </Button>
                    </Paper>
                </div>
                <div className={classes.arrowMove}>
                    <TextField className={classes.speedInput} 
                        label="mm/sec" 
                        type="number" 
                        InputLabelProps={{ shrink: true, }} 
                        variant="outlined" 
                        value={this.state.speed} 
                        onChange={e => this.handleSpeedChange(e)} 
                    />
                </div>

                <div className={classes.arrowMove}>

                    <FormControlLabel className={classes.speedInput}
                        control={
                            <Checkbox 
                                onChange={e => this.handleRunAfterLimitChange(e)}
                                color='primary'
                            />
                        }
                        label={('Продолжить после предела')}
                    />

                </div>

            </div>

        );
    }

}

Arrows.defaultProps = {
    onArrowDown: null,
    onArrowUp: null,
};

export default withStyles(useStyles)(Arrows);
