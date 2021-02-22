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

import Button from '@material-ui/core/Button';

import Brightness1Icon from '@material-ui/icons/Brightness1';

import {AppContext} from '../AppContext';

import { OBJ_NAME_PLASMA_ARC } from './CncRouter';
import { CMD_RUN, CMD_STOP } from './CncRouter';
import { PLASMA_ARC_START, PLASMA_ARC_STARTED, PLASMA_ARC_VOLTAGE } from './CncRouter';

import { withStyles } from '@material-ui/core/styles';

const useStyles = theme => ({
    root: {
        '& .MuiTextField-root': {
            margin: theme.spacing(1),
        },
        '& .MuiButton-root': {
            margin: theme.spacing(1),
            width: '-webkit-fill-available',
        },
        '& .MuiSvgIcon-root': {
            margin: theme.spacing(1),
            float: 'left',
            marginTop: 0,
        },
    },
});


class CncRouterPlasmaArc extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.state = {
            doStart: false,
            doStartRunned: false,
            arcStarted: false,
        };

    }

    componentDidMount(){

        // const { wsPrepareData, addListenerWsRecieve, removeListenerWsRecieve, concatenateBuffer } = this.context;
        const { addListenerWsRecieve } = this.context;
        const { item } = this.props;

        // let listenerInd = null;
        // listenerInd = addListenerWsRecieve(item.name, data => {
        addListenerWsRecieve(item.name, data => {
            data = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
            // console.log('Plasma arc data', data);
            if(data[0] === OBJ_NAME_PLASMA_ARC){
                if(data[1] === PLASMA_ARC_START){
                    this.setState({doStartRunned: false});
                    if(data[2] === CMD_RUN){
                        this.setState({doStart: true});
                    } else if(data[2] === CMD_STOP){
                        this.setState({doStart: false});
                    }

                } else if(data[1] === PLASMA_ARC_STARTED){
                    if(data[2] === 1){
                        this.setState({arcStarted: true});
                    } else{
                        this.setState({arcStarted: false});
                    }
                } else if(data[1] === PLASMA_ARC_VOLTAGE){
                
                }
            }
        });


    }

    handleStartClick(event){
        // const { doStart, arcStarted } = this.state;
        const { doStart } = this.state;

        // this.setState({doStart: !doStart});
        // this.setState({arcStarted: !arcStarted});
        this.setState({doStartRunned: true});

        if(typeof this.props.onStartClick === "function"){
            this.props.onStartClick(!doStart);
        }

    }

    render(){

        const { classes } = this.props;
        const { doStart, arcStarted } = this.state;

        return (
            <form className={classes.root}>
                <Button variant="contained" color="primary" disabled={this.state.doStartRunned} onClick={e => this.handleStartClick(e)}>
                    {!doStart ? ('Запустить') : ('Остановить')}
                </Button>
                {arcStarted &&
                <>
                <Brightness1Icon color='secondary'/>
                {('Дуга запущена')}
                </>
                }
                {!arcStarted &&
                <>
                <Brightness1Icon color='disabled'/>
                {('Дуга не запущена')}
                </>
                }

                <br/><br/>
            </form>
        );
    }
}

CncRouterPlasmaArc.defaultProps = {
    onStartClick: null,         // функция вызываемая при нажатии на кнопку "Запустить"/"Остановить"
};

export default withStyles(useStyles)(CncRouterPlasmaArc);
