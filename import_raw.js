const fetch = require('node-fetch')
const fs = require('fs')

function checkHttp200(res) {
    if (res.status === 200) {
        return res
    } else {
        return Promise.reject('got unexpected HTTP status ' + res.status)
    }
}

//const url = 'http://api-65-cwurst-clc3.cloud.itandtel.at'
//const url = 'http://localhost:8000'
const url = 'http://apigateway:8000'

fetch(url + '/auth/login?username=christoph&password=123456', {
    method: 'POST'
})
    .then((res) => res.text())
    .then((jwt) => {
        console.log('got jwt', jwt)
        return jwt
    })
    .then((jwt) => {
        let import_data = {
            user_id: 100,
        }
        return fetch(url + '/imports', {
            method: 'POST',
            headers: {
                'Authorization': 'bearer ' + jwt,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(import_data)
        })
            .then((res) => checkHttp200(res))
            .then((res) => res.json())
            .then((import_data) => {
                console.log('got import id', import_data.id)
                console.log('now uploading the raw image')

                const rawStream = fs.createReadStream('./resources/RAW1.NEF')
                return fetch(url + '/imports/' + import_data.id + '/raw', {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'bearer ' + jwt,
                    },
                    body: rawStream
                })
                    .then((res) => checkHttp200(res))
            })
            .then((res) => res.json())
            .then((import_data) => {
                console.log('now uploading the sidecar')
                const sidecarStream = fs.createReadStream('./resources/RAW1.NEF.pp3')
                return fetch(url + '/imports/' + import_data.id + '/sidecar', {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'bearer ' + jwt,
                    },
                    body: sidecarStream
                })
            })
            .then((res) => checkHttp200(res))
            .then((res) => res.json())
            .then((import_data) => {
                console.log('now finishing the upload')
                return fetch(url + '/imports/' + import_data.id + '/finish', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'bearer ' + jwt,
                    }
                })
            })
            .then((res) => checkHttp200(res))
            .then((res) => res.json())
            .then((import_data) => console.info('import successful', import_data))
    })
    .catch((e) => console.error('error importing the image: ', e))
