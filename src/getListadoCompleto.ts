// ==UserScript==
// @name         Conseguir listado completo de materias ITBA V2
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

String.prototype.match_ignore_tildes = function (search_string: String) {
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
    constructor({nombre = null, código = null, créditos = null, en_qué_cuatris_se_da = null,
                correlativas = null, departamento = null, info_según_carrera = null} = {}) {

        this.nombre = nombre;
        this.código = código;
        this.créditos = créditos;
        this.correlativas = correlativas;
        this.departamento = departamento;
        this.en_qué_cuatris_se_da = en_qué_cuatris_se_da;
        this.info_según_carrera = info_según_carrera;
    }

    static get_info_según_carrera(plan = null, carrera = null, especialización = null, créditos_requeridos = null, año = null, cuatrimestre = null){
        let info_según_carrera = {};
        if (carrera !== null && plan !== null) {
            if (especialización !== null) {
                info_según_carrera[`${plan}_${carrera}`] = {[especialización]: {año_según_plan: año,
                                                                                cuatrimestre_según_plan: cuatrimestre,
                                                                                créditos_requeridos: créditos_requeridos}};
            }
            else {
                info_según_carrera[`${plan}_${carrera}`] = {año_según_plan: año,
                                                            cuatrimestre_según_plan: cuatrimestre,
                                                            créditos_requeridos: créditos_requeridos};
            }
        }
        else {
            info_según_carrera = null;
        }

        return info_según_carrera;
    }

    agregar_carrera(plan, carrera, especialización, año, cuatrimestre) {
        if (especialización === null) {
            this.info_según_carrera[`${plan}_${carrera}`] = {año_según_plan: año, cuatrimestre_según_plan: cuatrimestre};
        }
        else {
            this.info_según_carrera[`${plan}_${carrera}`] = {[especialización]: {año_según_plan: año, cuatrimestre_según_plan: cuatrimestre}};
        }
    }

    get empty_fields() {
        let empty_fields = [];
        for (let key in this) {
            if (this[key] === null) {
                empty_fields.push(key);
            }
        }
        return empty_fields;
    }
}

class ListadoMaterias {
    constructor(lista_materias = []) {
        if (lista_materias.length > 0) {
            for (let [index, materia] of lista_materias.entries()) {
                lista_materias[index] = new Materia(materia);
            }
        }
        this.listado = lista_materias;
    }

    update(lista_materias) {
        if (lista_materias.length > 0) {
            for (let [index, materia] of lista_materias.entries()) {
                lista_materias[index] = new Materia(materia);
            }
        }
        this.listado = lista_materias;
    }

    /* agregar_materia(materia) {
        for (let [index, materia_ya_en_listado] of this.listado.entries()) {
            if (materia.código === materia_ya_en_listado.código) {
                this.listado[index].período = [materia_ya_en_listado.período, materia.período];
                return;
            }
        }
        this.listado.push(materia);
    } */

    agregar_materia(materia) {
        let materia_en_listado = this.get_por_código(materia.código).exact;
        // Si ya está la materia en el listado.
        if (materia_en_listado.length === 1) {
            materia_en_listado = materia_en_listado[0];
            let fields_to_replace = materia_en_listado.empty_fields;
            for (let field of fields_to_replace) {
                // Funca porque se pasan como referencia (kinda) los objetos.
                materia_en_listado[field] = materia[field];
            }
        }
        // Si no está la materia en el listado la agregamos.
        else if (materia_en_listado.length === 0) {
            this.listado.push(materia);
        }
        // Si hay dos materias con el mismo código hay algún problema...
        else {
            console.log(`Cuidado: Hay más de una materia con código "${materia.código}"`);
            return Error(`Más de una materia con código "${materia.código}"`);
        }

        return 0;
    }

    get_por_propiedad(search_string, get_propiedad, ignore_tildes = false) {
        let matches = {exact: [], containing: []};
        for (let [index, materia] of this.listado.entries()) {
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
        return this.get_por_propiedad(código, materia => materia.código);
    }

    get_por_créditos(créditos) {
        return this.get_por_propiedad(créditos, materia => materia.créditos);
    }

    get_por_correlativas(correlativas) {
        return this.get_por_propiedad(correlativas, materia => materia.correlativas);
    }

    get_por_departamento(departamento) {
        return this.get_por_propiedad(departamento, materia => materia.departamento);
    }

    get_por_créditos(créditos) {
        return this.get_por_propiedad(créditos, materia => materia.créditos);
    }
/*
    get_por_año(año) {
        return this.get_por_propiedad(año, materia => materia.año);
    }

    get_por_cuatrimestre(cuatrimestre) {
        return this.get_por_propiedad(cuatrimestre, materia => materia.cuatrimestre);
    }

    get_por_créditos_requeridos(créditos_requeridos) {
        return this.get_por_propiedad(créditos_requeridos, materia => materia.créditos_requeridos);
    }

    get_materia({
        nombre = null,
        código = null,
        créditos = null,
        créditos_requeridos = null,
        correlativas = null,
        año = null,
        cuatrimestre = null,
        departamento = null,
        período = null} = {}){

        let matches = [];
        for (let materia of this.listado) {
            if (test_ignore_tildes(materia.nombre, identificador)) {
                matches.push(materia);
            }
        }

        if (matches.length == 0) {
            console.log('No se encontró materia');
            return false;
        }
        else {
            return matches.length == 1 ? matches[0] : matches;
        }
    }

    get_correlativas(identificador) {
        let materia = this.get_materia(identificador);
        if (materia) {
            materia = materia.length > 1 ? materia[0] : materia;
            if (materia.correlativas.length > 0) {
                let correlativas = [];
                for (let correlativa of materia.correlativas) {
                    correlativas.push(this.get_materia(correlativa));
                }
                return correlativas.length == 1 ? correlativas[0] : correlativas;
            }
        }

        console.log('No tiene correlativas');
        return false;
    }*/
}

(function() {
    'use strict';

    document.addEventListener('readystatechange', (event) => {
        if (document.readyState == 'complete') {
            // Si estoy en Académica > Cursos tomo los datos disponibles de todas las materias.
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
                                                   departamento: departamento.innerText, en_qué_cuatris_se_da: período.innerText});
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
            // Si estoy en Académica > Carreras elijo cada carrera de a una para ir sacando la información faltante de las materias.
            else if (document.querySelector("#content > h3").innerText === 'Listado de carreras') {
                let listado_carreras = document.querySelectorAll('tbody > tr');

                let carrera_actual_index = sessionStorage.getItem('carrera_actual_index');
                carrera_actual_index = (carrera_actual_index === null ? 0 : parseInt(carrera_actual_index));

                let carrera_actual_nombre = listado_carreras[carrera_actual_index].cells[1].innerText;
                sessionStorage.setItem('carrera_actual_nombre', carrera_actual_nombre);

                sessionStorage.setItem('carrera_actual_index', carrera_actual_index + 1);
                // Los items que quedan son las licenciaturas que tienen un formato un poco distinto y paja de configurar.
                if (carrera_actual_index < 9) {
                    listado_carreras[carrera_actual_index].querySelectorAll('a')[0].click();
                }
            }
            // Elijo el plan.
            else if (document.querySelector("#content > h3").innerText === 'Listado de Planes de estudio') {
                // Ir al primer plan de la lista que debería ser el más actualizado.
                let plan_actual_nombre = document.querySelectorAll("table > tbody > tr")[0].cells[0].innerText;
                sessionStorage.setItem('plan_actual_nombre', plan_actual_nombre);

                document.querySelectorAll("tr > td > a")[0].click();
            }
            // Si estoy dentro del plan de una carrera.
            else if (document.querySelector("#content > h3").innerText === 'Detalle de Planes de estudio') {
                let lista_completa = new ListadoMaterias(JSON.parse(sessionStorage.lista_completa_materias));

                let tables = Array.from(document.querySelectorAll('body > div > div > div > div > table'));
                // Remueve la última tabla que es diferente y causa errores.
                tables.pop();
                if (tables.length > 0) {
                    let plan_actual = sessionStorage.plan_actual_nombre;
                    let carrera_actual = sessionStorage.carrera_actual_nombre;
                    for (let table of tables) {
                        let header = table.tHead.innerText;
                        if (!(/orientaciones/i.test(header))) {
                            // Sacar solo la parte importante de los headers.
                            header = header.split(/(\s-\s)|(\s\()/)[0];
                            // Las electivas están diagramadas de otra manera. Seguro falte algún identificador más, sería mejor directamente buscar si tiene "Contenido" adentro pero whatevs.
                            if (!(/(elect)|(práct)|(sat)/i.test(header))) {
                                let cuatris = table.tBodies[0].rows;
                                for (let cuatri of cuatris) {
                                    let [año, cuatrimestre] = cuatri.cells[0].querySelector('h4').innerText.split(' - ');
                                    año = parseInt(año.match(/\d+/)[0]);
                                    cuatrimestre = parseInt(cuatrimestre.match(/\d+/)[0]);
                                    let materias_cuatri = cuatri.cells[0].querySelector('table > tbody').rows;
                                    for (let materia of materias_cuatri) {
                                        let data = materia.cells;
                                        // Si el nombre no es un link quiere decir que no es una materia, lo cual rompería la lista.
                                        if (data[0].querySelector('a')) {
                                            let nombre = data[0].innerText.split(' - ')[1];
                                            let código = data[0].innerText.split(' - ')[0];
                                            let créditos = parseInt(data[1].innerText);
                                            let créditos_requeridos = parseInt(data[2].innerText);
                                            let correlativas = [];
                                            for (let correlativa of data[3].querySelectorAll('span')) {
                                                correlativas.push(correlativa.innerText.trim());
                                            }
                                            let especialización = null;
                                            if(!(/ciclo/i.test(header))) {
                                                especialización = header;
                                            }
                                            let info_según_carrera = Materia.get_info_según_carrera(plan_actual, carrera_actual, especialización,
                                                                                                    créditos_requeridos, año, cuatrimestre);
                                            let materia_actual = new Materia ({ nombre: nombre,
                                                                                código: código,
                                                                                créditos: créditos,
                                                                                correlativas: correlativas,
                                                                                info_según_carrera});

                                            lista_completa.agregar_materia(materia_actual);
                                        }
                                    }
                                }
                            }
                            // Si es tabla de electivas.
                            else {
                                let materias = table.tBodies[0].querySelector('table > tbody').rows;
                                for (let materia of materias) {
                                    let data = materia.cells;
                                    // Si el nombre no es un link quiere decir que no es una materia, lo cual rompería la lista.
                                    if (data[0].querySelector('a')) {
                                        let nombre = data[0].innerText.split(' - ')[1];
                                        let código = data[0].innerText.split(' - ')[0];
                                        let créditos = parseInt(data[1].innerText);
                                        let créditos_requeridos = parseInt(data[2].innerText);
                                        let correlativas = [];
                                        for (let correlativa of data[3].querySelectorAll('span')) {
                                            correlativas.push(correlativa.innerText.trim());
                                        }
                                        let especialización = header;
                                        let info_según_carrera = Materia.get_info_según_carrera(plan_actual, carrera_actual, especialización, créditos_requeridos);
                                        let materia_actual = new Materia ({ nombre: nombre,
                                                                            código: código,
                                                                            créditos: créditos,
                                                                            correlativas: correlativas,
                                                                            info_según_carrera});

                                        lista_completa.agregar_materia(materia_actual);
                                    }
                                }
                            }
                        }
                    }
                    sessionStorage.setItem('lista_completa_materias', JSON.stringify(lista_completa.listado));
                }
                // Volver a Académica > Carreras para seguir con las otras materias.
                document.querySelectorAll('li > ul > li > a')[2].click();
            }
        }
    });

})();
