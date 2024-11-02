let devices = getDevices(); // Load existing devices from local storage

// Function to get devices from local storage
function getDevices() {
    return JSON.parse(localStorage.getItem('devices')) || [];
}

// Function to save devices to local storage
function saveDevices() {
    localStorage.setItem('devices', JSON.stringify(devices));
}

// Function to add a device
function addDevice() {
    const deviceType = document.getElementById('deviceType').value;
    const brand = deviceType === 'camera' ? document.getElementById('cameraBrand').value : document.getElementById('switchBrand').value;
    const ip = deviceType === 'camera' ? document.getElementById('cameraIP').value : document.getElementById('switchIP').value;
    const location = deviceType === 'camera' ? document.getElementById('cameraLocation').value : document.getElementById('switchLocation').value;
    const mac = deviceType === 'camera' ? document.getElementById('cameraMAC').value : document.getElementById('switchMAC').value;

    // Validate required fields
    if (!validateDeviceFields(brand, ip, location, mac)) return;

    // Check for unique IP or MAC address
    if (isDeviceUnique(ip, mac)) {
        if (deviceType === 'camera') {
            const connectedSwitch = document.getElementById('cameraSwitch').value;
            const switchPort = document.getElementById('cameraPort').value;
            devices.push({ type: 'camera', brand, ip, location, mac, connectedSwitch, switchPort });
        } else if (deviceType === 'switch') {
            const ports = parseInt(document.getElementById('switchPorts').value, 10);
            devices.push({ type: 'switch', brand, ip, location, mac, ports });
            populateSwitchDropdown(); // Update dropdown after adding a switch
        }

        saveDevices();
        alert(`${deviceType.charAt(0).toUpperCase() + deviceType.slice(1)} added successfully!`);
        clearForm();
    }
}

// Function to validate device fields
function validateDeviceFields(brand, ip, location, mac) {
    if (!brand || !ip || !location || !mac) {
        alert("Please fill in all required fields.");
        return false;
    }
    return true;
}

// Function to check if device IP or MAC is unique
function isDeviceUnique(ip, mac) {
    if (devices.some(device => device.ip === ip)) {
        alert("This IP address is already in use.");
        return false;
    }
    if (devices.some(device => device.mac === mac)) {
        alert("This MAC address is already in use.");
        return false;
    }
    return true;
}

// Function to clear the form
function clearForm() {
    document.getElementById('deviceForm').reset();
    toggleForms();
}

// Function to toggle forms based on selected device type
function toggleForms() {
    const deviceType = document.getElementById('deviceType').value;

    document.getElementById('cameraForm').style.display = deviceType === 'camera' ? 'block' : 'none';
    document.getElementById('switchForm').style.display = deviceType === 'switch' ? 'block' : 'none';

    clearDropdowns();
    if (deviceType === 'camera') {
        populateSwitchDropdown();
    }
}

// Function to clear dropdowns and reset values
function clearDropdowns() {
    document.getElementById('cameraSwitch').innerHTML = '<option value="">Select Switch</option>';
    document.getElementById('cameraPort').innerHTML = '';
    document.getElementById('switchIPAddress').value = '';
}

// Function to format MAC Address input
function formatMacAddress(input) {
    let value = input.value.replace(/[^0-9A-Fa-f:]/g, '');
    if (value.length > 17) value = value.slice(0, 17);
    input.value = value.toUpperCase();
}

// Function to populate the switch dropdown
function populateSwitchDropdown() {
    const switchSelect = document.getElementById('cameraSwitch');
    switchSelect.innerHTML = '<option value="">Select Switch</option>'; // Clear dropdown

    const switches = devices.filter(device => device.type === 'switch');
    switches.forEach(switchDevice => {
        const option = document.createElement('option');
        option.value = switchDevice.brand; // Use brand or IP as needed
        option.text = `${switchDevice.brand} (${switchDevice.ip})`; // Display both brand and IP
        switchSelect.appendChild(option);
    });
}

// Function to populate port options based on selected switch
function populatePortOptions() {
    const switchSelect = document.getElementById('cameraSwitch');
    const selectedSwitch = devices.find(device => device.type === 'switch' && device.brand === switchSelect.value);
    const portSelect = document.getElementById('cameraPort');
    portSelect.innerHTML = ''; // Clear previous options

    if (selectedSwitch) {
        for (let i = 1; i <= selectedSwitch.ports; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Port ${i}`;
            portSelect.appendChild(option);
        }
        document.getElementById('switchIPAddress').value = selectedSwitch.ip;
    } else {
        console.error("Selected switch not found in devices.");
    }
}

// Function to search for devices
function searchDevice(event) {
    event.preventDefault();
    const query = document.getElementById('searchQuery').value.toLowerCase();
    const typeFilter = document.getElementById('deviceTypeFilter').value;
    const resultsContainer = document.getElementById('searchResults');

    resultsContainer.innerHTML = ''; // Clear previous results

    // Filter devices based on the search query and type
    const filteredDevices = devices.filter(device => {
        const matchesType = typeFilter ? device.type === typeFilter : true;
        const matchesQuery = device.ip.toLowerCase().includes(query) ||
                             device.mac.toLowerCase().includes(query) ||
                             device.location.toLowerCase().includes(query) ||
                             device.brand.toLowerCase().includes(query);
        return matchesType && matchesQuery;
    });

    // Display results
    filteredDevices.forEach((device, index) => {
        const deviceDiv = document.createElement('div');
        deviceDiv.classList.add('card', 'mb-3');
        deviceDiv.innerHTML = `
            <div class="card-body">
                <h5 class="card-title">${device.brand} (${device.type})</h5>
                <p class="card-text">IP: ${device.ip}<br>MAC: ${device.mac}<br>Location: ${device.location}</p>
                <button class="bt1" onclick="openEditModal(${index})">Edit</button>
                <button class="bt1" onclick="deleteDevice(${index})">Delete</button>
            </div>
        `;
        resultsContainer.appendChild(deviceDiv);
    });
}

// Function to delete a device
function deleteDevice(index) {
    if (confirm("Are you sure you want to delete this device?")) {
        devices.splice(index, 1); // Remove device from the array
        saveDevices(); // Save the updated devices array
        searchDevice(event); // Refresh search results
    }
}

// Function to open the edit modal
function openEditModal(index) {
    const device = devices[index];
    document.getElementById('editBrand').value = device.brand;
    document.getElementById('editIP').value = device.ip;
    document.getElementById('editLocation').value = device.location;
    document.getElementById('editMAC').value = device.mac;
    document.getElementById('editSwitch').value = device.connectedSwitch || '';
    document.getElementById('editIndex').value = index;

    // Populate the switch ports if connected
    populateEditPortOptions(device.connectedSwitch, device.switchPort);
    
    $('#editDeviceModal').modal('show'); // Using Bootstrap's jQuery to show the modal
}

// Function to populate edit port options
function populateEditPortOptions(connectedSwitch, selectedPort) {
    const editPortSelect = document.getElementById('editPort');
    editPortSelect.innerHTML = ''; // Clear previous options

    const switchDevice = devices.find(device => device.brand === connectedSwitch && device.type === 'switch');
    if (switchDevice) {
        for (let i = 1; i <= switchDevice.ports; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Port ${i}`;
            editPortSelect.appendChild(option);
        }
        editPortSelect.value = selectedPort; // Set the selected port
    }
}

// Function to save changes made in the edit modal
function saveDeviceChanges() {
    const index = document.getElementById('editIndex').value;
    devices[index].brand = document.getElementById('editBrand').value;
    devices[index].ip = document.getElementById('editIP').value;
    devices[index].location = document.getElementById('editLocation').value;
    devices[index].mac = document.getElementById('editMAC').value;
    devices[index].connectedSwitch = document.getElementById('editSwitch').value;
    devices[index].switchPort = document.getElementById('editPort').value;

    $('#editDeviceModal').modal('hide'); // Hide the modal
    saveDevices(); // Save updated devices to local storage
    searchDevice(event); // Refresh search results
}

// Populate switch options and set up event listeners on page load
window.onload = function() {
    populateSwitchDropdown();
    document.getElementById('deviceType').addEventListener('change', toggleForms);
    document.getElementById('cameraSwitch').addEventListener('change', populatePortOptions);
    document.getElementById('searchForm').addEventListener('submit', searchDevice);
};
