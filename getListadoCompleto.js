// ==UserScript==
// @name         Conseguir listado completo de materias ITBA
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://sga.itba.edu.ar/app2/L7ExSNbPC4sb6TPJDblCApV28_TV0rSO9auoWx8mJndaDLR_xeZ86GesasHvBscoQIl0NrMY4pFjMp3fr-O6GXotdqoZDnD6*
// @match        https://sga.itba.edu.ar/app2/L7ExSNbPC4sb6TPJDblCApV28_TV0rSO9auoWx8mJndaDLR_xeZ86GesasHvBscoFFijACSWTOfAXio2ubnCcr7J1iUTOZ2x*
// @match        https://sga.itba.edu.ar/app2/fyBfZ9p6tr*
// @icon         https://www.google.com/s2/favicons?domain=edu.ar
// @grant        none
// ==/UserScript==

String.prototype.match_ignore_tildes = function (search_string) {
    let replace_vowel_pattern = /([aá])|([eé])|([ií])|([oó])|([uú])/gi;
    let search_regexp = new RegExp(search_string.replaceAll(replace_vowel_pattern, (match,p1,p2,p3,p4,p5,offset,string)=>{
        p1 = (p1 !== undefined ? '[aá]' : '');
        p2 = (p2 !== undefined ? '[eé]' : '');
        p3 = (p3 !== undefined ? '[ií]' : '');
        p4 = (p4 !== undefined ? '[oó]' : '');
        p5 = (p5 !== undefined ? '[uú]' : '');
        return `${p1}${p2}${p3}${p4}${p5}`;
    }),'i');
    let match = this.match(search_regexp);
    return match ? match : false;
}

String.prototype.test_exactish_or_containing = function (search_string, ignore_tildes = true) {
    let match;
    if (ignore_tildes) {
        match = this.match_ignore_tildes(search_string);
    }
    else {
        let search_regexp = new RegExp(search_string, 'i');
        match = this.match(search_regexp);
        match = match ? match : false;
    }
    if (match[0] === this.valueOf()) {
        return {match: true, exact: true};
    }       
    else if (match) {
        return {match: true, exact: false};
    }
    else
    {
        return {match: false, exact: false};
    }
}

class Materia {
    constructor({nombre, código, créditos, créditos_requeridos,
                correlativas, departamento, período, carrera, plan,
                año, cuatrimestre, especialización} = {}) {
                    
        this.nombre = nombre;
        this.código = código;
        this.créditos = créditos;
        this.correlativas = correlativas;
        this.departamento = departamento;
        this.en_qué_cuatris_se_da = período;
        this.créditos_requeridos = créditos_requeridos;

        function get_info_según_carrera() {
            let info_según_carrera = {};
            if (carrera !== undefined && plan !== undefined) {
                if (especialización !== undefined) {
                    info_según_carrera[`${plan}_${carrera}`] = {[especialización]: {año_según_plan: año, cuatrimestre_según_plan: cuatrimestre,}};
                }
                else {
                    info_según_carrera[`${plan}_${carrera}`] = {año_según_plan: año, cuatrimestre_según_plan: cuatrimestre};
                }
            }

            return info_según_carrera;
        }

        this.info_según_carrera = get_info_según_carrera();
    }

    agregar_carrera(plan, carrera, especialización, año, cuatrimestre) {
        if (especialización === undefined) {
            this.info_según_carrera[`${plan}_${carrera}`] = {año_según_plan: año, cuatrimestre_según_plan: cuatrimestre};
        }
        else {
            this.info_según_carrera[`${plan}_${carrera}`] = {[especialización]: {año_según_plan: año, cuatrimestre_según_plan: cuatrimestre}};
        }
    }
}

/* class Materia {
    constructor({nombre, código, créditos, créditos_requeridos,
                correlativas, departamento, período, carrera, plan,
                año, cuatrimestre, especialización} = {}) {
        this.nombre = nombre;
        this.código = código;
        this.créditos = créditos;
        this.correlativas = correlativas;
        this.departamento = departamento;
        this.en_qué_cuatris_se_da = período;
        this.info_según_carrera = [{[carrera]: plan,
                                    [especialización]: {año_y_cuatri_según_plan: [año, cuatrimestre],
                                                        créditos_requeridos: créditos_requeridos}}];
    }

    agregar_carrera(carrera, plan, año, cuatrimestre) {
        this.info_según_carrera.push({carrera: carrera, plan: plan, año_según_plan: año, cuatrimestre_según_plan: cuatrimestre});
    }
} */

class ListadoMaterias {
    constructor(lista_materias = []) {
        this.listado = lista_materias;
    }

    update(lista_materias) {
        this.listado = lista_materias;
    }

    agregar_materia(materia) {
        for (let [index, materia_repetida] of this.listado.entries()) {
            if (materia.código === materia_repetida.código) {
                this.listado[index].período = [materia_repetida.período, materia.período];
                return;
            }
        }
        this.listado.push(materia);
    }

    get_por_propiedad(search_string, get_propiedad, ignore_tildes = false) {
        let matches = {exact: [], containing: []};
        for (let materia of this.listado) {
            let propiedad = get_propiedad(materia).toString();
            let exactish = propiedad.test_exactish_or_containing(search_string, ignore_tildes);
            if (exactish.match) {
                if (exactish.exact) {
                    matches.exact.push(materia);
                }
                else {
                    matches.containing.push(materia);
                }
            }
        }
        return matches;
    }
    
    get_por_nombre(nombre) {
        return this.get_por_propiedad(nombre, materia => materia.nombre, true);
    }

    get_por_código(código) {
        return this.get_por_propiedad(código.toString(), materia => materia.código)
    }

    get_por_créditos(créditos) {
        return this.get_por_propiedad(créditos.toString(), materia => materia.créditos)
    }

    get_por_créditos_requeridos(créditos_requeridos) {
        return this.get_por_propiedad(créditos_requeridos.toString(), materia => materia.créditos_requeridos)
    }

    get_por_correlativas(correlativas) {
        return this.get_por_propiedad(correlativas.toString(), materia => materia.correlativas)
    }
}

(function() {
    'use strict';

    document.addEventListener('readystatechange', (event) => {
        if (document.readyState == 'complete') {
            // Si estoy en Académica > Cursos
            if (document.querySelector("#content > h3").innerText === 'Cursos') {
                let current_page = sessionStorage.getItem('current_page');
                if (current_page === null && document.querySelector('em > span').innerText === '1') {
                    document.querySelector('a.last').click();
                }
                else if (current_page === null) {
                    sessionStorage.setItem('last_page', document.querySelector('em > span').innerText);
                    sessionStorage.setItem('current_page', 1);
                    document.querySelector('a.first').click();
                }
                else {
                    let materias_página_actual = new ListadoMaterias();
                    let data = document.querySelectorAll('tbody > tr');
                    for (let row of data){
                        let [código, nombre, , departamento, período] = row.cells;
                        let materia = new Materia({nombre: nombre.innerText, código: código.innerText,
                                                   departamento: departamento.innerText, período: período.innerText});
                        materias_página_actual.agregar_materia(materia);
                    }
                    let lista_completa = sessionStorage.getItem('lista_completa_materias');
                    lista_completa = (lista_completa === null ? [] : JSON.parse(lista_completa));
                    sessionStorage.setItem('lista_completa_materias', JSON.stringify(lista_completa.concat(materias_página_actual.listado)));

                    sessionStorage.setItem('current_page', parseInt(document.querySelector('em > span').innerText) + 1);
                    if (current_page !== sessionStorage.getItem('last_page')) {
                        document.querySelectorAll("thead > tr:nth-child(2) > td > div.navigator > span > a.next")[0].click();
                    }
                    // Si ya conseguí todas las materias, ir a Académica > Carreras
                    else {
                        document.querySelectorAll('li > ul > li > a')[2].click();
                    }
                }
            }
            // Si estoy en Académica > Carreras
            else if (document.querySelector("#content > h3").innerText === 'Listado de carreras') {
                let listado_carreras = document.querySelectorAll('tbody > tr');

                let carrera_actual_index = sessionStorage.getItem('carrera_actual_index');
                carrera_actual_index = (carrera_actual_index === null ? 0 : parseInt(carrera_actual_index));

                let carrera_actual_nombre = listado_carreras[carrera_actual_index].cells[1].innerText;
                sessionStorage.setItem('carrera_actual_nombre', carrera_actual_nombre);

                sessionStorage.setItem('carrera_actual_index', carrera_actual_index + 1);
                listado_carreras[carrera_actual_index].querySelectorAll('a')[0].click();
            }
            else if (document.querySelector("#content > h3").innerText === 'Listado de Planes de estudio') {
                // Ir al primer plan de la lista que debería ser el más actualizado.
                let plan_actual_nombre = document.querySelectorAll("table > tbody > tr")[0].cells[0].innerText;
                sessionStorage.setItem('plan_actual_nombre', plan_actual_nombre);

                document.querySelectorAll("tr > td > a")[0].click();
            }
            else if (document.querySelector("#content > h3").innerText === 'Detalle de Planes de estudio') {
                let lista_completa = JSON.parse( sessionStorage.getItem('lista_completa_materias'));
                if (lista_completa === null) {
                    Error('Lista completa no almacenada.');
                }
                let materias_csv = '';

                let tables = Array.from(document.querySelectorAll('body > div > div > div > div > table > tbody'));
                tables.pop();
                // Remove last table which is different and causes an error.
                let plan = sessionStorage.getItem('plan_actual_nombre');
                let materias_plan_actual = new ListadoMaterias();
                for (let table of tables) {
                    let cuatris = table.rows;
                    for (let cuatri of cuatris) {
                        let [año, cuatrimestre] = cuatri.cells[0].querySelector('h4').innerText.split(' - ');
                        // Evita tables tipo "Contenido:" en planes con especialización.
                        if ((/año/i).test(año)) {
                            año = parseInt(año.match(/\d+/)[0]);
                            cuatrimestre = parseInt(cuatrimestre.match(/\d+/)[0]);
                            let materias_cuatri = cuatri.cells[0].querySelector('table > tbody').rows;
                            for (let materia of materias_cuatri) {
                                let data = materia.cells;

                                let nombre = data[0].innerText.split(' - ')[1];
                                let código = data[0].innerText.split(' - ')[0];
                                let créditos = parseInt(data[1].innerText);
                                let créditos_requeridos = parseInt(data[2].innerText);
                                let correlativas = [];
                                for (let correlativa of data[3].querySelectorAll('span')) {
                                    correlativas.push(correlativa.innerText.trim());
                                }

                                let match = materias_plan_actual.get_por_código(código);
                                if (match.exact.length === 0 && match.containing.length === 0) {
                                    let materia_actual = new Materia({nombre: nombre, código: código, créditos: créditos, créditos_requeridos: créditos_requeridos,
                                                                      correlativas: correlativas, plan: plan, año: año, cuatrimestre: cuatrimestre});
                                    materias_plan_actual.agregar_materia(materia_actual);

                                    let materia_array = [];
                                    for (let campo in materia_actual) {
                                        materia_array.push(typeof(materia_actual[campo]) === 'object' ? Object.values(materia_actual[campo]) : materia_actual[campo]);
                                    }
                                    materias_csv = materias_csv + materia_array.join('|-|') + '\n';
                                }
                            }
                        }
                    }
                }
                sessionStorage.setItem('lista_materias', lista_completa + materias_csv);
            }
        }
    });

})();
