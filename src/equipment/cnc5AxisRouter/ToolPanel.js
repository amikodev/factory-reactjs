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

import {AppContext} from '../../AppContext';



import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({

    root: {

    },

    toolIcons: {

        height: 70,
        width: 1180,
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'rgba(128, 128, 128, 0.1)',


        '& > .rightPart': {
            float: 'right',
            marginRight: 10,
        },

        '& .item': {
            width: 50,
            height: 50,
            float: 'left',

            backgroundImage: "url('./Cnc5Axes-CamModule-Icons.png')",
            backgroundSize: 500,
            backgroundColor: '#CCC',

            cursor: 'pointer',

            borderRadius: 10,
            border: '1px #FFF solid',

            boxShadow: '0 0 9px -3px #444',

            marginLeft: 10,
            marginTop: 10,


        },
        '& .item.selected': {
            backgroundColor: '#EEE',
            borderColor: '#000',
        },
        '& .toolNameSelected': {
            position: 'absolute',
            bottom: -20,
            fontFamily: 'monospace',
        },

        '& .item.pointer': { backgroundPositionX: 0, backgroundPositionY: 0, },
        '& .item.pointer:hover': { backgroundPositionX: -50, backgroundPositionY: 0, },

        '& .item.selectMesh': { backgroundPositionX: -100, backgroundPositionY: 0, },
        '& .item.selectMesh:hover': { backgroundPositionX: -150, backgroundPositionY: 0, },

        '& .item.selectGroupMesh': { backgroundPositionX: -200, backgroundPositionY: 0, },
        '& .item.selectGroupMesh:hover': { backgroundPositionX: -250, backgroundPositionY: 0, },

        '& .item.addComponent': { backgroundPositionX: -300, backgroundPositionY: 0, },
        '& .item.addComponent:hover': { backgroundPositionX: -350, backgroundPositionY: 0, },


    },

});



const TOOL_PANEL_NAME_MAIN = 'main';
const TOOL_PANEL_NAME_RIGHT = 'right';

const TOOL_POINTER = 'pointer';
const TOOL_SELECT_MESH = 'selectMesh';
const TOOL_SELECT_GROUP_MESH = 'selectGroupMesh';
const TOOL_ADD = 'addComponent';



// const toolPanelNames = [TOOL_POINTER, TOOL_SELECT_MESH, TOOL_SELECT_GROUP_MESH];
const toolPanelNames = [TOOL_POINTER, TOOL_SELECT_GROUP_MESH];

const rightToolPanelNames = [TOOL_ADD];





/**
 * Шаблон страницы
 */
class ToolPanel extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.state = {

            toolNameSelected: TOOL_POINTER,



        };

    }


    // componentDidMount(){
    //     if(typeof this.props.onSelectTool === 'function'){
    //         this.props.onSelectTool(this.state.toolNameSelected);
    //     }
    // }


    handleToolIconClick(event, panelName, toolName){
        if(this.state.toolNameSelected !== toolName){
            this.setState({toolNameSelected: toolName});
            if(typeof this.props.onSelectTool === 'function'){
                this.props.onSelectTool(panelName, toolName);
            }
        }
    }

    handleRightToolIconClick(event, panelName, toolName){
        if(typeof this.props.onSelectTool === 'function'){
            this.props.onSelectTool(panelName, toolName);
        }
    }

    

    render(){

        const { classes } = this.props;

        return (
            <div className={classes.toolIcons}>
                {toolPanelNames.map(toolName => {
                    return (
                        <div 
                            key={toolName}
                            className={`item ${toolName} `+(this.state.toolNameSelected === toolName ? 'selected':'')} 
                            title={toolName}
                            onClick={e => this.handleToolIconClick(e, TOOL_PANEL_NAME_MAIN, toolName)}
                        >
                        </div>                                    
                    );
                })}

                <div className="rightPart">

                    {rightToolPanelNames.map(toolName => {
                        return (
                            <div
                                key={toolName}
                                className={`item ${toolName}`}
                                title={toolName}
                                onClick={e => this.handleRightToolIconClick(e, TOOL_PANEL_NAME_RIGHT, toolName)}
                            >
                            </div>
                        );
                    })}

                </div>

                <div className='toolNameSelected'>
                    {this.state.toolNameSelected}
                </div>
            </div>
        );
    }

}

ToolPanel.defaultProps = {

    onSelectTool: null,

};


export default withStyles(useStyles)(ToolPanel);

export {
    TOOL_PANEL_NAME_MAIN, TOOL_PANEL_NAME_RIGHT, 
};

export {
    TOOL_POINTER, TOOL_SELECT_MESH, TOOL_SELECT_GROUP_MESH, TOOL_ADD, 
};



