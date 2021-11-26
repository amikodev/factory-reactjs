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

import {AppContext} from '../../../AppContext';

import InitialBlank from './InitialBlank.ts';
import { StlModelLink } from './StlModel.ts';

import CamObject from './CamObject';
import CamSupportObject from './CamSupportObject';

import ExpandedList from '../../../ExpandedList.tsx';


import { withStyles } from '@material-ui/core/styles';
const useStyles = theme => ({

    root: {

    },
});


/**
 * Компоненты проекта
 */
class ProjectComponents extends React.Component{

    static contextType = AppContext;

    constructor(props){
        super(props);

        this.addComponent = this.addComponent.bind(this);
        this.removeComponent = this.removeComponent.bind(this);
        this.updateTree = this.updateTree.bind(this);
        this.getData = this.getData.bind(this);
        this.getList = this.getList.bind(this);
        this.handleComponentClick = this.handleComponentClick.bind(this);

        this.state = {

            listComponents: [],
            
        };

        this.components = {

            blankCount: 0,

            tree: [],

        };

    }

    /**
     * Добавление компонента в дерево
     * @param CamObject comp компонент
     */
    addComponent(comp){

        let caption = '';
        if(comp instanceof InitialBlank){
            this.components.blankCount++;
            caption = ('Заготовка')+` #${this.components.blankCount}`;

            // console.log(comp.supportObjects, comp.childs, comp.supportObjects + comp.childs);
            // console.log(comp.childs, [].concat(...comp.supportObjects, ...comp.childs));
            this.components.tree.push({
                caption,
                object: comp,
                // childs: comp.childs,
                // childs: [],
                // childs: comp.supportObjects + comp.childs,
                // childs: [].concat(...comp.supportObjects, ...comp.childs),
                // supportObjects: comp.supportObjects,
            });
        }

        this.setState({listComponents: this.components.tree});

    }

    /**
     * Удаление компонента из дерева
     * @param CamObject comp компонент
     */
     removeComponent(comp){

        let tree = this.components.tree.filter(el => el.object !== comp);
        this.components.tree = tree;
        this.setState({listComponents: this.components.tree});
    }

    /**
     * Обновление дерева
     */
    updateTree(){
        this.setState({listComponents: this.components.tree});
    }

    /**
     * Получить данные в простом виде для возможного дальнейшего сохранения
     */
    getData(){
        let data = [];

        this.components.tree.forEach(c => {
            const comp = c.object;
            if(comp instanceof InitialBlank){
                data.push(comp.dataForSave);
            }

        });

        return data;
    }

    /**
     * Получить список компонентов
     */
    getList(){
        let data = [];
        this.components.tree.forEach(c => {
            const comp = c.object;
            data.push(comp);
        });
        return data;
    }

    handleComponentClick(event, object){

        // console.log('click component', object);
        if(object instanceof CamObject){
            // if(object instanceof InitialBlank){

            // } else if(object instanceof StlModelLink){

            // }

            // // тестовая конструкция для проверки
            if(typeof this.props.onComponentClick === 'function'){
                this.props.onComponentClick(event, object);
            }
        } else if(object instanceof CamSupportObject){
            if(typeof this.props.onSupportObjectClick === 'function'){
                this.props.onSupportObjectClick(event, object);
            }
        }
    }


    render(){

        const { classes } = this.props;
        const { listComponents } = this.state;

        return (
            <div className={classes.root}>
                <List component='nav'>
                {listComponents.map((childData, ind) => {
                    return (
                        <ExpandedList 
                            key={ind} 
                            data={childData} 
                            onClick={(e, object) => this.handleComponentClick(e, object)}
                        />
                    );
                })}
                </List>
            </div>
        );
    }

}

ProjectComponents.defaultProps = {

    onComponentClick: null,
    onSupportObjectClick: null,

};


export default withStyles(useStyles)(ProjectComponents);
