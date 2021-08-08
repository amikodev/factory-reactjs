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

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { FixedSizeList } from 'react-window';


import {AppContext} from '../../AppContext';

import { OBJ_NAME_CNC_GCODE } from './CncRouter';


import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({
    root: {
        '& .MuiListItem-root': {
            paddingTop: 0,
            paddingBottom: 0,
        },
        '& .MuiListItemText-primary': {
            fontSize: '0.8rem',
            inlineSize: 'max-content',
        },
        paddingTop: 1,
        paddingBottom: 1,

        // width: '100%',
        // height: 400,
        // maxWidth: 300,
        // backgroundColor: theme.palette.background.paper,
    },
});


class GcodeList extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.state = {
            countLines: 0,
            gcodeLines: [],

            selectedInd: 0,
        };

        this.refList = React.createRef();

        // this.gcodeLines = [];
    }

    componentDidUpdate(prevProps){
        if(this.props.gcodeTimestamp !== prevProps.gcodeTimestamp){
            // console.log('CncRouterGcode', this.props.gcodeLines);
            this.setState({gcodeLines: this.props.gcodeLines, countLines: this.props.gcodeLines.length});
        }

        // let selectedInd = this.props.currentGcodeLine;
        // console.log(this.refList.current);
        // this.refList.current.scrollToItem(selectedInd, 'center');
        // console.log(this.refList.current.scrollToItem);

    }

    componentDidMount(){
        const { item } = this.props;
        const { addListenerWsRecieve } = this.context;

        // подписка на изменение номера текущей строки
        addListenerWsRecieve(item.name, (data) => {
            let data2 = data instanceof ArrayBuffer ? new Uint8Array(data) : data;

            if(data2[0] === OBJ_NAME_CNC_GCODE){
                let numLine = (data2[2] << 8) + data2[1];
                this.setState({selectedInd: numLine}, () => {
                    this.refList.current.scrollToItem(numLine, 'center');
                });
            }
        });

    }

    render(){

        const { classes } = this.props;

        // let _this = this;

        const renderRow = props => {
            const { index, style } = props;

            // console.log(index, style);
        
            return (
                <ListItem 
                    button 
                    style={style} 
                    key={index} 
                    // selected={index === _this.props.currentGcodeLine} 
                    selected={index === this.state.selectedInd}
                    // autoFocus={index === _this.props.currentGcodeLine}
                >
                    <ListItemText primary={this.state.gcodeLines[index]} />
                </ListItem>
            );
        
        }

        return (
            <div className={classes.root}>
                <FixedSizeList ref={this.refList} height={400} itemSize={20} itemCount={this.state.countLines}>
                    {renderRow}
                </FixedSizeList>
            </div>
        );
    }


}

// function renderRow(props){
//     const { index, style } = props;

//     // console.log(index, style);

//     return (
//         <ListItem button style={style} key={index} selected={index === 3}>
//             <ListItemText primary={'Item '+index} />
//         </ListItem>
//     );
// }

GcodeList.defaultProps = {
    gcodeLines: [],
    currentGcodeLine: 0,
    gcodeTimestamp: 0,
};

export default withStyles(useStyles)(GcodeList);

