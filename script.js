function getDevices() {
    return JSON.parse(localStorage.getItem('devices')) || [];
}
// Display search results in the index.html page
function displayResults(results) {
    const resultsDiv = document.getElementById('searchResults');
    resultsDiv.innerHTML = ''; // Clear previous results

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p class="text-danger">No devices found.</p>';
    } else {
        results.forEach((device, index) => {
            // Format the device name for switches
            const deviceName = device.type === 'switch' && device.ports 
                ? `${device.brand} ${device.ports.length} Port switch` 
                : device.brand;
                
            const deviceDetails = `
                <div class="card mb-3">
                    <div class="card-body">
                        <h5 class="card-title">${deviceName}</h5>
                        <p class="card-text"><strong>IP:</strong> ${device.ip}</p>
                        <p class="card-text"><strong>Location:</strong> ${device.location}</p>
                        <p class="card-text"><strong>MAC:</strong> ${device.mac}</p>
                        ${device.type === 'camera' ? `<p class="card-text"><strong>Connected to:</strong> ${device.switch} via port ${device.port}</p>` : ''}
                        <button class="btn btn-primary" onclick="editDevice(${index})">Edit</button>
                        <button class="btn btn-danger" onclick="deleteDevice('${device.brand}')">Delete</button>
                    </div>
                </div>`;
            resultsDiv.innerHTML += deviceDetails;
        });
    }
}


function formatMacAddress(input) {
    // Remove any non-hexadecimal characters
    const value = input.value.replace(/[^0-9A-Fa-f]/g, '');

    // Split into pairs and join with ':'
    const formatted = value.match(/.{1,2}/g)?.join(':') || '';

    // Set the input value to the formatted string
    input.value = formatted.toUpperCase();
}

function editDevice(index) {
    const devices = getDevices();
    const device = devices[index];

    // Populate the form with the current device details
    document.getElementById('editBrand').value = device.brand;
    document.getElementById('editIP').value = device.ip;
    document.getElementById('editLocation').value = device.location;
    document.getElementById('editMAC').value = device.mac;
    document.getElementById('editSwitch').value = device.switch || '';
    document.getElementById('editPort').value = device.port || '';
    document.getElementById('editIndex').value = index; // Store index for saving

    // Show the modal
    $('#editDeviceModal').modal('show');
}
function saveDeviceChanges() {
    const index = document.getElementById('editIndex').value;
    const devices = getDevices();

    devices[index] = {
        ...devices[index],
        brand: document.getElementById('editBrand').value,
        ip: document.getElementById('editIP').value,
        location: document.getElementById('editLocation').value,
        mac: document.getElementById('editMAC').value,
        switch: document.getElementById('editSwitch').value,
        port: document.getElementById('editPort').value,
    };

    localStorage.setItem('devices', JSON.stringify(devices));
    alert(`Device with brand ${devices[index].brand} updated successfully.`);
    $('#editDeviceModal').modal('hide'); // Close the modal
    searchDevice(new Event('submit')); // Refresh search results
}


// Function to search devices based on query and device type
function searchDevice(event) {
    event.preventDefault(); // Prevent form submission
    const query = document.getElementById('searchQuery').value.toLowerCase();
    const deviceType = document.getElementById('deviceTypeFilter').value;
    const devices = getDevices();

    // Filter devices based on the search query and selected device type
    const results = devices.filter(device => {
        const matchesQuery = device.ip.toLowerCase().includes(query) ||
                             device.mac.toLowerCase().includes(query) ||
                             device.location.toLowerCase().includes(query) ||
                             device.brand.toLowerCase().includes(query);

        const matchesType = deviceType ? device.type === deviceType : true;

        return matchesQuery && matchesType;
    });

    displayResults(results);
}
function deleteDevice(brand) {
    // Show a confirmation dialog before deleting
    const confirmation = confirm(`Are you sure you want to delete the device with brand ${brand}?`);
    if (confirmation) {
        let devices = getDevices();
        devices = devices.filter(device => device.brand.toLowerCase() !== brand.toLowerCase());
        localStorage.setItem('devices', JSON.stringify(devices));
        alert(`Device with brand ${brand} deleted successfully.`);
        searchDevice(new Event('submit')); // Refresh search results
    }
}
function clearSearch() {
    console.log("Clear search function called");
    document.getElementById('searchQuery').value = '';
    document.getElementById('deviceTypeFilter').value = '';
    const allDevices = getDevices();
    console.log("Devices fetched: ", allDevices);
    displayResults(allDevices);
}
function addDeviceToLocalStorage(device) {
    const devices = getDevices();
    devices.push(device);
    localStorage.setItem('devices', JSON.stringify(devices));
}

function populateSwitchOptions() {
    const switchSelect = document.getElementById('cameraSwitch');
    switchSelect.innerHTML = ''; // Clear previous options
    const devices = getDevices().filter(device => device.type === 'switch');

    // Populate dropdown with added switches
    devices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.brand;
        option.textContent = device.brand;
        switchSelect.appendChild(option);
    });

    // Populate port options if there is a selected switch
    if (switchSelect.value) {
        populatePortOptions();
    }
}

function populatePortOptions() {
    const switchBrand = document.getElementById('cameraSwitch').value;
    const switchPortSelect = document.getElementById('cameraPort');
    switchPortSelect.innerHTML = ''; // Clear previous options

    // Find the selected switch and get its ports
    const devices = getDevices();
    const selectedSwitch = devices.find(device => device.type === 'switch' && device.brand === switchBrand);

    if (selectedSwitch && selectedSwitch.ports) {
        selectedSwitch.ports.forEach(port => {
            const option = document.createElement('option');
            option.value = port;
            option.textContent = port;
            switchPortSelect.appendChild(option);
        });
    }
}

function addDevice() {
    const deviceType = document.getElementById('deviceType').value;
    const device = {
        brand: deviceType === 'camera' ? document.getElementById('cameraBrand').value : document.getElementById('switchBrand').value,
        ip: deviceType === 'camera' ? document.getElementById('cameraIP').value : document.getElementById('switchIP').value,
        location: deviceType === 'camera' ? document.getElementById('cameraLocation').value : document.getElementById('switchLocation').value,
        mac: deviceType === 'camera' ? document.getElementById('cameraMAC').value : document.getElementById('switchMAC').value,
        type: deviceType,
    };

    if (deviceType === 'camera') {
        device.switch = document.getElementById('cameraSwitch').value;
        device.port = document.getElementById('cameraPort').value;
    } else if (deviceType === 'switch') {
        const numPorts = parseInt(document.getElementById('switchPorts').value, 10);
        device.ports = Array.from({ length: numPorts }, (_, i) => `Port ${i + 1}`);
    }

    addDeviceToLocalStorage(device);
    alert(`${device.brand} added successfully.`);
    document.getElementById('deviceForm').reset();
    populateSwitchOptions(); // Refresh switch options after adding a device
}

function toggleForms() {
    const deviceType = document.getElementById('deviceType').value;
    document.getElementById('cameraForm').style.display = deviceType === 'camera' ? 'block' : 'none';
    document.getElementById('switchForm').style.display = deviceType === 'switch' ? 'block' : 'none';
    populateSwitchOptions();
}

// Event listener for switch selection change to refresh ports
document.getElementById('cameraSwitch').addEventListener('change', populatePortOptions);

// Populate switch options on page load
window.onload = function() {
    populateSwitchOptions();
};
