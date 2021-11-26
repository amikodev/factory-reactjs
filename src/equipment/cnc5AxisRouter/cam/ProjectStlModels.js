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

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import { IconButton } from '@material-ui/core';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';


import MenuIcon from '@material-ui/icons/Menu';


import {AppContext} from '../../../AppContext';

import { StlModel } from './StlModel.ts';

import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({

    root: {

        // '& > ul': {
        //     listStyle: 'none',
        //     padding: 0,
        // },

    },
});


/**
 * STL модели
 */
class ProjectStlModels extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.addModel = this.addModel.bind(this);
        this.removeModel = this.removeModel.bind(this);
        this.getList = this.getList.bind(this);

        this.state = {

            listModels: [],

            menu1AnchorEl: null,
            menu1Model: null,

        };

        this.models = {

            count: 0,

            list: [],

        };

    }

    addModel(model){

        let caption = '';
        let detail = '';
        if(model instanceof StlModel){
            this.models.count++;
            caption = model.caption;
            detail = model.uuid;

            this.models.list.push({
                caption, 
                detail,
                // params: 
                object: model,
            });
    
        }

        // console.log(model);


        this.setState({listModels: this.models.list});

    }

    removeModel(model){

        let list = this.models.list.filter(el => el.object !== model);
        this.models.list = list;
        this.setState({listModels: this.models.list});

    }

    getList(){
        return this.state.listModels;
    }

    handleModelClick(event, m){

        console.log('click model', m);

    }

    handleMenu1Close(){
        this.setState({menu1AnchorEl: null, menu1Model: null})
    }

    handleMenu1Click(event, model, itemName){

        const { onMenuClick } = this.props;

        // console.log(event, m, itemName);
        // handleMenu1Close();
        this.setState({menu1AnchorEl: null, menu1Model: null});

        // if(name === 'addToSelected'){

        // }

        if(typeof onMenuClick === 'function'){
            onMenuClick(event, model, itemName);
        }

    }


    render(){

        const { classes } = this.props;

        const { listModels } = this.state;

        return (
            <div className={classes.root}>

                {/* <div style={{fontFamily: 'monospace'}}>STL models</div> */}


                <List component='nav'>
                {listModels.map((m, ind) => {
                    // console.log(m);
                    return (
                        <React.Fragment key={ind}>
                        <ListItem button onClick={e => this.handleModelClick(e, m)}>
                            <ListItemText
                                primary={m.caption}
                                secondary={m.detail}
                            />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" onClick={e => this.setState({menu1AnchorEl: e.currentTarget, menu1Model: m.object})}>
                                    <MenuIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>

                        {/* <Menu
                            anchorEl={this.state.menu1AnchorEl}
                            keepMounted
                            open={Boolean(this.state.menu1AnchorEl)}
                            onClose={() => this.handleMenu1Close()}
                        >
                            <MenuItem onClick={e => {console.log(m); this.handleMenu1Click(e, this.state.menu1Model, 'addToSelected') }}>
                                {('Установить на выбранные поверхности')}
                            </MenuItem>

                        </Menu> */}


                        </React.Fragment>
                    );
                })}
                </List>


                <Menu
                    anchorEl={this.state.menu1AnchorEl}
                    keepMounted
                    open={Boolean(this.state.menu1AnchorEl)}
                    onClose={() => this.handleMenu1Close()}
                >
                    <MenuItem onClick={e => this.handleMenu1Click(e, this.state.menu1Model, 'addToSelected')}>
                        {('Установить на выбранные поверхности')}
                    </MenuItem>

                </Menu>


                {/* <ul>

                {listModels.map((m, ind) => {
                    return (
                        <li key={ind} onClick={e => this.handleModelClick(e, m)}>
                            {m.caption} <br/>
                            <span style={{fontSize: '0.8rem', fontFamily: 'Courier New'}}>
                                {m.detail}
                            </span>
                        </li>
                    );
                })}

                </ul> */}

            </div>
        );
    }

}


ProjectStlModels.defaultProps = {

    onMenuClick: null,

};


export default withStyles(useStyles)(ProjectStlModels);

