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



class About extends React.Component{


    render(){
        return (
            <React.Fragment>

            <Typography component="h4" variant="h4" gutterBottom>
                {('AsketCNC')}
            </Typography>
            <Typography component="p" gutterBottom>
                {('Управление промышленным оборудованием и техникой.')}
            </Typography>
            <Typography component="p" gutterBottom>
                {('Типы поддерживаемого оборудования')}:
                <ul>
                    <li>{('3-х координатный ЧПУ станок')};</li>
                    <li>{('Частотный преобразователь')};</li>
                    <li>{('5-ти координатный ЧПУ станок с поворотно-наклонной головой')}.</li>
                </ul>
            </Typography>
            </React.Fragment>
        );
    }
}

export default About;
