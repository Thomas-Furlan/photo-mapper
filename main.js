    var modal = document.getElementById('Modal');
    var span = document.getElementsByClassName("close")[0];
    var fileList = document.getElementById("fileList");
    var mapElement = document.getElementById("map");

    var lat = 46.807747;
    var lon = 2.497689;
    var map = null;
    var markerClusters;
    var markers = [];
    var currentFile = null;
    var names = new Array;
    

    var monthNames = [ "janvier", "février", "mars", "avril", "mai", "juin", 
                        "juillet", "août", "septembre", "octobre", "novembre", "decembre" ];

    class decimalCoordinates {
        constructor(latitude, longitude) 
        { this.latitude = latitude; this.longitude = longitude; }
    };

    function resetMapZoom() {
        if(markers.length !== 0) {
            var group = L.featureGroup(markers);
            markers.forEach(marker => marker.closePopup());
            map.fitBounds(group.getBounds().pad(0.25));
        }
    }

    function initMap() {
        map = L.map('map').setView([lat, lon], 6);
        markerClusters = L.markerClusterGroup();
        L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
            attribution: 'données © OpenStreetMap/ODbL - rendu OSM Monde',
            minZoom: 1,
            maxZoom: 20
        }).addTo(map);				
    }

    function reinitMap() {
        map.off();
        map.remove();
        initMap();
        names = [];
        markers = [];
    }

    function resetMapAndFileList() {
        reinitMap();
        fileList.innerHTML = "<p>Aucun fichier sélectionné !</p>";
    }

    function addMarkerOnMap(name, lat, long, file) {
        if(!names.includes(name)) {
            src = window.URL.createObjectURL(file);
            var marker = L.marker([lat, long]);
            marker.bindPopup('<img src=\"' + src + '\" height=80 /><div id="clickable" onClick="displayModal()">' + name + '</div>');
            marker.on('click', function() {currentFile = file});
            markerClusters.addLayer(marker);
            markers.push(marker);
            var group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.25));
            map.addLayer(markerClusters);
        }
    }

    function isImage(file){
        return file['type'].includes('image');
    }

    function convertCoordinates(lat, latRef, long, longRef) {
        let latitude = lat[0].numerator/lat[0].denominator + lat[1].numerator/lat[1].denominator / 60 + lat[2].numerator/lat[2].denominator /3600;
        let longitude = long[0].numerator/long[0].denominator + long[1].numerator/long[1].denominator / 60 + long[2].numerator/long[2].denominator /3600;
        if(latRef == "S") {
            latitude = -latitude;
        } 
        if(longRef == "W") {
            longitude *= -longitude;
        }
        return {latitude, longitude};
        
    }

    function convertCoordinatesForDisplay(lat, latRef, long, longRef) {
        const latForDisplay = (lat[0].numerator/lat[0].denominator).toLocaleString(undefined, {maximumFractionDigits: 3}) + "° " 
                                + (lat[1].numerator/lat[1].denominator).toLocaleString(undefined, {maximumFractionDigits: 3}) + "' "
                                + (lat[2].numerator/lat[2].denominator).toLocaleString(undefined, {maximumFractionDigits: 3}) + "\" "
                                + latRef ;
        const longForDisplay = (long[0].numerator/long[0].denominator).toLocaleString(undefined, {maximumFractionDigits: 3}) + "° " 
                                + (long[1].numerator/long[1].denominator).toLocaleString(undefined, {maximumFractionDigits: 3}) + "' "
                                + (long[2].numerator/long[2].denominator).toLocaleString(undefined, {maximumFractionDigits: 3}) + "\" "
                                + longRef;
        return {latForDisplay, longForDisplay};
    }

    function convertEXIFDate(stringDate) {
        dateParts = stringDate.split(' ');
        timeParts = dateParts[1].split(':');
        dateParts = dateParts[0].split(':');

        year = dateParts[0];
        month = dateParts[1];
        monthName = monthNames[Number(month - 1)];
        day = dateParts[2];

        hour = timeParts[0];
        minute = timeParts[1];
        second = timeParts[2];
        
        localeDate = day + " " + monthName + " " + year;
        localeTime = hour + ":" + minute + ":" + second;
        return "le " + localeDate + " à " + localeTime;
    }

    function convertFileSystemDate(lastModifiedDate) {
        let date = new Date(lastModifiedDate);
        localeDate = date.toLocaleDateString();
        localeTime = date.toLocaleTimeString();
        return "le " + localeDate + " à " + localeTime;
    }

    function convertExposureTime(exposureTime) {
        return "1/" + (exposureTime.denominator/exposureTime.numerator).toLocaleString(undefined, {maximumFractionDigits: 0}) + "s";
    }

    function convertSizeForDisplay(size)
    {
        var sizes = [' octets', ' Ko', ' Mo', ' Go', ' To'];
        for (var i = 1; i < sizes.length; i++)
        {
            if (size < Math.pow(1024, i)) return (Math.round((size/Math.pow(1024, i-1))*100)/100) + sizes[i-1];
        }
        return size;
    }

    function convertAltitude(rawAltitude, altitudeRef) {
        const altitude = Math.round(rawAltitude.numerator / rawAltitude.denominator).toLocaleString(undefined, {maximumFractionDigits: 1}) + " m";
        if (altitudeRef == 1) {
            return "-" + altitude + " (en dessous du niveau de la mer!)";
        }
        return altitude;
    }

    function handleFiles(files) {
        var displayOnMapButton;
        if (!files.length) {
            fileList.innerHTML = "<p>Aucun fichier sélectionné !</p>";
        } else {
            fileList.innerHTML = "";
            let list = document.createElement("dl");
            displayOnMapButton = document.createElement("button");
            displayOnMapButton.innerHTML = "Placer les images sur la carte";
            displayOnMapButton.setAttribute("class", "styled");

            fileList.appendChild(displayOnMapButton);
            fileList.appendChild(list);
            for (i = 0; i < files.length; i++) {
                if(isImage(files[i])) {
                    var info = document.createElement("span");
                    info.setAttribute("class", "picture-name");
                    let image = document.createElement("ul");
                    let name = document.createElement("ul");
                    list.appendChild(image);
                    list.appendChild(name);
                    
                    let img = document.createElement("img");
                    img.src = window.URL.createObjectURL(files[i]);
                    img.height = 60;
                    img.onload = function() {
                        window.URL.revokeObjectURL(this.src);
                    }
                    let file = files[i];
                    img.onclick = function() {
                        currentFile = file;
                        displayModal();
                    };
                    info.innerHTML=file.name;
                    image.appendChild(img);
                    name.appendChild(info);
                    let separator = document.createElement("hr");
                    list.appendChild(separator);
                }
            }
            displayOnMapButton.onclick = function() {
                for(i = 0; i < files.length; i++) {
                    let file = files[i];
                    EXIF.getData(file, function() {
                            let name = file.name;
                            const rawLong = EXIF.getTag(file, "GPSLongitude");
                            const rawLongRef = EXIF.getTag(file, "GPSLongitudeRef")
                            const rawLat = EXIF.getTag(file, "GPSLatitude");
                            const rawLatRef = EXIF.getTag(file, "GPSLatitudeRef");
                            if( rawLat && rawLong && (rawLat != 0 || rawLong != 0)) {
                                const {latitude: decimalLat, longitude: decimalLong} = convertCoordinates(rawLat, rawLatRef, rawLong, rawLongRef);
                                addMarkerOnMap(name, decimalLat, decimalLong, file);
                                names.push(name);
                            }
                            });
                    }
            }
        }
    }

    function displayModal() {
        if(currentFile) {
            modal.style.display = "block";
            mapElement.style.height = "0px";
            var pictureTitle = document.getElementById("picture-title");
            pictureTitle.innerHTML = currentFile.name;
            var pictureInfos = document.getElementById("picture-infos");
            pictureInfos.innerHTML = "";
            let img = document.createElement("img");
            img.src = window.URL.createObjectURL(currentFile);
            img.onload = function() {
                window.URL.revokeObjectURL(this.src);
            }
            pictureInfos.appendChild(img);
            EXIF.getData(currentFile, function() {
                
                const size = convertSizeForDisplay(currentFile.size);
                
                
                let infos = document.createElement("p");
                infos.setAttribute("class", "picture-data");
                let imageInfos = `Taille du fichier: ${size}`;
                
                const width = EXIF.getTag(currentFile, "PixelXDimension");
                const height = EXIF.getTag(currentFile, "PixelYDimension");
                
                if(width && height) {
                    imageInfos += `<br>Dimension de l'image: ${width}x${height} pixels<br>`;
                } 
                
                const ExifDate = EXIF.getTag(currentFile, "DateTimeOriginal");
                let date;
                if(ExifDate) {
                    date = convertEXIFDate(ExifDate);
                    imageInfos += `<br>Date de prise de vue: ${date}<br>`;
                }
                else {
                    let tempdate = currentFile.lastModified;
                    date = convertFileSystemDate(tempdate);
                    imageInfos += `<br>Date du fichier : ${date} (pas d'info EXIF)<br>`;
                }
                
                
                const model = EXIF.getTag(currentFile, "Model");
                if(model) imageInfos += `<br>Modèle de l'appareil: ${model}<br>`;
                
                const exposureTime = EXIF.getTag(currentFile, "ExposureTime");
                if(exposureTime) {
                    imageInfos += `<br>Vitesse: ${convertExposureTime(exposureTime)}`;
                }
                
                const aperture = EXIF.getTag(currentFile, "FNumber");
                if(aperture) imageInfos += `<br>Ouverture: f/${aperture}`;
                
                const iso = EXIF.getTag(currentFile, "ISOSpeedRatings");
                if(iso) imageInfos += `<br>Sensibilité ISO: ${iso}<br>`;
                
                const rawLong = EXIF.getTag(currentFile, "GPSLongitude");
                const rawLongRef = EXIF.getTag(currentFile, "GPSLongitudeRef")
                const rawLat = EXIF.getTag(currentFile, "GPSLatitude");
                const rawLatRef = EXIF.getTag(currentFile, "GPSLatitudeRef");
                if(rawLong && rawLat) {
                    const {latForDisplay, longForDisplay} = convertCoordinatesForDisplay(rawLat, rawLatRef, rawLong, rawLongRef);
                    const {latitude: decimalLat, longitude: decimalLong} = convertCoordinates(rawLat, rawLatRef, rawLong, rawLongRef);
                    imageInfos += `<br>Latitude: ${latForDisplay} (${decimalLat.toLocaleString(undefined, {maximumSignificantDigits: 8})})<br>
                                    Longitude: ${longForDisplay} (${decimalLong.toLocaleString(undefined, {maximumSignificantDigits: 8})})`;
                }

                const rawAltitude = EXIF.getTag(currentFile, "GPSAltitude");
                const rawAltitudeRef = EXIF.getTag(currentFile, "GPSAltitudeRef");
                if(rawAltitude && rawAltitudeRef != undefined) {
                    const altitude =  convertAltitude(EXIF.getTag(currentFile, "GPSAltitude"), EXIF.getTag(currentFile, "GPSAltitudeRef"));
                    imageInfos += `<br>Altitude: ${altitude}`
                }
                infos.innerHTML = imageInfos;
                pictureInfos.appendChild(infos);
                });
        }
    }

    span.onclick = function() {
        modal.style.display = "none";
        mapElement.style.height = "600px";
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            mapElement.style.height = "600px";
        }
    }
    window.onload = function(){
        initMap();
    };