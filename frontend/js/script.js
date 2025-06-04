document.addEventListener("DOMContentLoaded", function () {
  // --- CÁC BIẾN TOÀN CỤC ---
  let currentMarkers = L.featureGroup();
  let userCurrentLocation = null;
  let userLocationMarker = null;
  let routePolyline = null;
  let searchLocationMarker = null;

  // --- AUTHENTICATION VARIABLES ---
  let currentUser = null;
  let authToken = null;

  // --- CÁC PHẦN TỬ DOM ---
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const showAllFieldsButton = document.getElementById('showAllFieldsButton');
  const searchResults = document.getElementById('searchResults');
  const locateMeButton = document.getElementById('locateMeButton');
  const loginModal = document.getElementById('loginModal');
  const registerModal = document.getElementById('registerModal');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const userInfo = document.getElementById('userInfo');
  const authButtons = document.getElementById('authButtons');
  const welcomeMessage = document.getElementById('welcomeMessage');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Khởi tạo bản đồ Leaflet
  const initialLat = 21.0285;
  const initialLon = 105.8542;
  const map = L.map('map').setView([initialLat, initialLon], 13);

  // Thêm lớp bản đồ OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add markers layer to map
  currentMarkers.addTo(map);

  // --- HÀM HỖ TRỢ: CUSTOM ICONS ---
  const fieldIcon = L.AwesomeMarkers.icon({
      icon: 'futbol',
      markerColor: 'green',
      prefix: 'fa'
  });

  const userIcon = L.AwesomeMarkers.icon({
      icon: 'user',
      markerColor: 'blue',
      prefix: 'fa'
  });

  const startPointIcon = L.AwesomeMarkers.icon({
      icon: 'play',
      markerColor: 'green',
      prefix: 'fa'
  });

  const endPointIcon = L.AwesomeMarkers.icon({
      icon: 'flag-checkered',
      markerColor: 'red',
      prefix: 'fa'
  });

  const searchPointIcon = L.AwesomeMarkers.icon({
      icon: 'search-location',
      markerColor: 'purple',
      prefix: 'fa'
  });

  // --- AUTHENTICATION FUNCTIONS ---
  function showLoginModal() {
      if (loginModal) {
          loginModal.style.display = 'block';
          document.body.style.overflow = 'hidden';
      }
  }

  function closeLoginModal() {
      if (loginModal) {
          loginModal.style.display = 'none';
          document.body.style.overflow = 'auto';
          if (loginForm) loginForm.reset();
      }
  }

  function showRegisterModal() {
      if (registerModal) {
          registerModal.style.display = 'block';
          document.body.style.overflow = 'hidden';
      }
  }

  function closeRegisterModal() {
      if (registerModal) {
          registerModal.style.display = 'none';
          document.body.style.overflow = 'auto';
          if (registerForm) registerForm.reset();
      }
  }

  function showLoginForm() {
      closeRegisterModal();
      showLoginModal();
  }

  function showRegisterForm() {
      closeLoginModal();
      showRegisterModal();
  }

  function updateAuthUI(user) {
      if (user) {
          if (authButtons) authButtons.style.display = 'none';
          if (userInfo) userInfo.style.display = 'flex';
          if (welcomeMessage) welcomeMessage.textContent = `Chào ${user.username}!`;
          currentUser = user;

          localStorage.setItem('currentUser', JSON.stringify(user));
          if (authToken) {
              localStorage.setItem('authToken', authToken);
          }
      } else {
          if (authButtons) authButtons.style.display = 'flex';
          if (userInfo) userInfo.style.display = 'none';
          currentUser = null;
          authToken = null;

          localStorage.removeItem('currentUser');
          localStorage.removeItem('authToken');
      }
  }

  async function handleLogin(event) {
      event.preventDefault();

      const formData = new FormData(loginForm);
      const username = formData.get('username');
      const password = formData.get('password');

      if (!username || !password) {
          alert('Vui lòng nhập đầy đủ thông tin đăng nhập.');
          return;
      }

      try {
          const response = await fetch('http://localhost:5000/api/auth/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, password })
          });

          const data = await response.json();

          if (response.ok) {
              authToken = data.token;
              updateAuthUI(data.user);
              closeLoginModal();
              alert('Đăng nhập thành công!');
              loadAllFootballFields();
          } else {
              alert(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
          }
      } catch (error) {
          console.error('Login error:', error);
          alert('Lỗi kết nối đến server. Vui lòng thử lại sau.');
      }
  }

  async function handleRegister(event) {
      event.preventDefault();

      const formData = new FormData(registerForm);
      const username = formData.get('username');
      const email = formData.get('email');
      const password = formData.get('password');
      const confirmPassword = formData.get('confirmPassword');

      if (!username || !email || !password || !confirmPassword) {
          alert('Vui lòng nhập đầy đủ thông tin đăng ký.');
          return;
      }

      if (password !== confirmPassword) {
          alert('Mật khẩu xác nhận không khớp.');
          return;
      }

      if (password.length < 6) {
          alert('Mật khẩu phải có ít nhất 6 ký tự.');
          return;
      }

      try {
          const response = await fetch('http://localhost:5000/api/auth/register', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ username, email, password })
          });

          const data = await response.json();

          if (response.ok) {
              closeRegisterModal();
              alert('Đăng ký thành công! Vui lòng đăng nhập.');
              showLoginModal();
          } else {
              alert(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
          }
      } catch (error) {
          console.error('Register error:', error);
          alert('Lỗi kết nối đến server. Vui lòng thử lại sau.');
      }
  }

  function handleLogout() {
      if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
          updateAuthUI(null);
          alert('Đã đăng xuất thành công!');
          clearMapAndResults();
      }
  }

  function checkStoredAuth() {
      const storedUser = localStorage.getItem('currentUser');
      const storedToken = localStorage.getItem('authToken');

      if (storedUser) {
          try {
              const user = JSON.parse(storedUser);
              authToken = storedToken;
              updateAuthUI(user);
              return true;
          } catch (error) {
              console.error('Error parsing stored user data:', error);
              localStorage.removeItem('currentUser');
              localStorage.removeItem('authToken');
              return false;
          }
      }
      return false;
  }

  // --- MAP AND FIELD FUNCTIONS ---
  async function fetchAPI(endpoint) {
      try {
          const headers = { 'Content-Type': 'application/json' };
          if (authToken) {
              headers['Authorization'] = `Bearer ${authToken}`;
          }

          const response = await fetch(`http://localhost:5000/api/${endpoint}`, { headers });
          if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          return data.data || data;
      } catch (error) {
          console.error('Error fetching data from API:', error);
          throw error;
      }
  }

  // --- Lấy vị trí hiện tại của người dùng ---
  function getUserLocation() {
      if (!navigator.geolocation) {
          alert('Trình duyệt của bạn không hỗ trợ định vị địa lý.');
          return;
      }

      if (locateMeButton) {
          locateMeButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang định vị...';
          locateMeButton.disabled = true;
      }

      // Check if geolocation permission is already granted
      if (navigator.permissions) {
          navigator.permissions.query({ name: 'geolocation' }).then(function(permission) {
              console.log('Geolocation permission status:', permission.state);

              if (permission.state === 'denied') {
                  showLocationPermissionHelp();
                  resetLocationButton();
                  return;
              }

              // Proceed with location request
              requestLocation();
          }).catch(function(error) {
              console.log('Permission query not supported, proceeding with location request');
              requestLocation();
          });
      } else {
          // Fallback for browsers that don't support permissions API
          requestLocation();
      }
  }

  function requestLocation() {
      const options = {
          enableHighAccuracy: true,
          timeout: 10000, // Increased timeout
          maximumAge: 60000 // Allow cached position up to 1 minute
      };

      navigator.geolocation.getCurrentPosition(
          onLocationSuccess,
          onLocationError,
          options
      );
  }

  function onLocationSuccess(position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      userCurrentLocation = { lat, lon };

      console.log('Location obtained:', { lat, lon, accuracy });

      // Cập nhật hoặc tạo marker cho vị trí người dùng
      if (userLocationMarker) {
          userLocationMarker.setLatLng([lat, lon]);
      } else {
          userLocationMarker = L.marker([lat, lon], { icon: userIcon })
              .addTo(map)
              .bindPopup(`<b>Vị trí của bạn</b><br>Độ chính xác: ${Math.round(accuracy)}m`)
              .openPopup();
      }

      map.setView([lat, lon], 15);

      // Show success message
      const message = `Đã định vị thành công!\nTọa độ: ${lat.toFixed(6)}, ${lon.toFixed(6)}\nĐộ chính xác: ${Math.round(accuracy)}m`;
      alert(message);

      resetLocationButton();

      // Optional: Load nearby fields
      loadNearbyFields(lat, lon);
  }

  function onLocationError(error) {
      console.error('Geolocation error:', error);

      let helpMessage = '';

      switch (error.code) {
          case error.PERMISSION_DENIED:
              errorMessage += 'Bạn đã từ chối quyền truy cập vị trí.';
              helpMessage = 'Để sử dụng tính năng này, vui lòng:\n\n1. Nhấp vào biểu tượng khóa/vị trí ở thanh địa chỉ\n2. Cho phép truy cập vị trí\n3. Tải lại trang và thử lại';
              break;
          case error.POSITION_UNAVAILABLE:
              errorMessage += 'Thông tin vị trí không khả dụng.';
              helpMessage = 'Vui lòng kiểm tra:\n• Kết nối internet\n• GPS đã bật chưa\n• Thử di chuyển ra ngoài trời';
              break;
          case error.TIMEOUT:
              errorMessage += 'Yêu cầu định vị đã hết thời gian.';
              helpMessage = 'Vui lòng thử lại. Nếu vẫn lỗi, hãy:\n• Kiểm tra kết nối mạng\n• Tắt/bật GPS\n• Thử lại sau vài phút';
              break;
          default:

              break;
      }

      alert(errorMessage + '\n\n' + helpMessage);

      if (error.code === error.PERMISSION_DENIED) {
          showLocationPermissionHelp();
      }

      resetLocationButton();
  }

  function showLocationPermissionHelp() {
      // Create a more detailed help modal
      let helpModal = document.getElementById('locationHelpModal');
      if (!helpModal) {
          helpModal = document.createElement('div');
          helpModal.id = 'locationHelpModal';
          helpModal.innerHTML = `
              <div class="modal-backdrop" onclick="closeLocationHelpModal()">
                  <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 500px; padding: 20px; background: white; border-radius: 8px; color: black;">
                      <h3 style="margin-top: 0; color: #e74c3c;"><i class="fas fa-exclamation-triangle"></i> Cần quyền truy cập vị trí</h3>
                      <p>Để sử dụng tính năng định vị, vui lòng làm theo các bước sau:</p>
                      <ol style="text-align: left; padding-left: 20px;">
                          <li>Nhấp vào biểu tượng <i class="fas fa-lock"></i> hoặc <i class="fas fa-map-marker-alt"></i> ở thanh địa chỉ trình duyệt</li>
                          <li>Chọn "Cho phép" hoặc "Allow" cho quyền truy cập vị trí</li>
                          <li>Tải lại trang (F5) và thử lại</li>
                      </ol>
                      <div style="margin: 20px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border-left: 4px solid #007bff;">
                          <strong>Gợi ý khác:</strong><br>
                          • Đảm bảo GPS/vị trí đã được bật trên thiết bị<br>
                          • Thử sử dụng chức năng tìm kiếm theo địa chỉ<br>
                          • Sử dụng trình duyệt Chrome hoặc Firefox để có trải nghiệm tốt nhất
                      </div>
                      <button onclick="closeLocationHelpModal()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Đã hiểu</button>
                      <button onclick="tryLocationAgain()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-left: 10px;">Thử lại</button>
                  </div>
              </div>
          `;

          helpModal.style.cssText = `
              display: none;
              position: fixed;
              z-index: 10000;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
          `;

          const backdrop = helpModal.querySelector('.modal-backdrop');
          backdrop.style.cssText = `
              background-color: rgba(0, 0, 0, 0.5);
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
          `;

          document.body.appendChild(helpModal);
      }

      helpModal.style.display = 'block';
  }

  function closeLocationHelpModal() {
      const modal = document.getElementById('locationHelpModal');
      if (modal) {
          modal.style.display = 'none';
      }
  }

  function tryLocationAgain() {
      closeLocationHelpModal();
      getUserLocation();
  }

  function resetLocationButton() {
      if (locateMeButton) {
          locateMeButton.innerHTML = '<i class="fas fa-location-arrow"></i> Vị trí của tôi';
          locateMeButton.disabled = false;
      }
  }

  // Optional: Load nearby fields when location is obtained
  async function loadNearbyFields(lat, lon, radius = 5) {
      if (!currentUser) return;

      try {
          console.log('Loading nearby fields...');
          const nearbyFields = await fetchAPI(`fields?lat=${lat}&lng=${lon}&radius=${radius}&limit=20`);

          if (nearbyFields && nearbyFields.length > 0) {
              console.log(`Found ${nearbyFields.length} nearby fields`);
              displayFootballFields(nearbyFields);
          }
      } catch (error) {
          console.error('Error loading nearby fields:', error);
          // Don't show error to user, just fall back to all fields
          loadAllFootballFields();
      }
  }

  // Add alternative location input method
  function showManualLocationInput() {
      let locationInputModal = document.getElementById('locationInputModal');
      if (!locationInputModal) {
          locationInputModal = document.createElement('div');
          locationInputModal.id = 'locationInputModal';
          locationInputModal.innerHTML = `
              <div class="modal-backdrop" onclick="closeLocationInputModal()">
                  <div class="modal-content" onclick="event.stopPropagation()" style="max-width: 400px; padding: 20px; background: white; border-radius: 8px; color: black;">
                      <h3 style="margin-top: 0;"><i class="fas fa-map-marker-alt"></i> Nhập vị trí thủ công</h3>
                      <form id="manualLocationForm">
                          <div style="margin-bottom: 15px;">
                              <label for="manualAddress" style="display: block; margin-bottom: 5px;">Địa chỉ:</label>
                              <input type="text" id="manualAddress" placeholder="Ví dụ: Hà Nội, Việt Nam" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                          </div>
                          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                              <div style="flex: 1;">
                                  <label for="manualLat" style="display: block; margin-bottom: 5px;">Vĩ độ:</label>
                                  <input type="number" id="manualLat" step="any" placeholder="21.0285" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                              </div>
                              <div style="flex: 1;">
                                  <label for="manualLng" style="display: block; margin-bottom: 5px;">Kinh độ:</label>
                                  <input type="number" id="manualLng" step="any" placeholder="105.8542" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                              </div>
                          </div>
                          <div style="text-align: right;">
                              <button type="button" onclick="closeLocationInputModal()" style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Hủy</button>
                              <button type="submit" style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Xác nhận</button>
                          </div>
                      </form>
                  </div>
              </div>
          `;

          locationInputModal.style.cssText = `
              display: none;
              position: fixed;
              z-index: 10000;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
          `;

          const backdrop = locationInputModal.querySelector('.modal-backdrop');
          backdrop.style.cssText = `
              background-color: rgba(0, 0, 0, 0.5);
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
          `;

          document.body.appendChild(locationInputModal);

          // Add form handler
          const form = document.getElementById('manualLocationForm');
          form.addEventListener('submit', handleManualLocation);
      }

      locationInputModal.style.display = 'block';
  }

  function closeLocationInputModal() {
      const modal = document.getElementById('locationInputModal');
      if (modal) {
          modal.style.display = 'none';
          const form = document.getElementById('manualLocationForm');
          if (form) form.reset();
      }
  }

  function handleManualLocation(event) {
      event.preventDefault();

      const lat = parseFloat(document.getElementById('manualLat').value);
      const lng = parseFloat(document.getElementById('manualLng').value);

      if (isNaN(lat) || isNaN(lng)) {
          alert('Vui lòng nhập tọa độ hợp lệ.');
          return;
      }

      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          alert('Tọa độ không hợp lệ. Vĩ độ: -90 đến 90, Kinh độ: -180 đến 180.');
          return;
      }

      // Set manual location
      userCurrentLocation = { lat, lon: lng };

      // Update marker
      if (userLocationMarker) {
          userLocationMarker.setLatLng([lat, lng]);
      } else {
          userLocationMarker = L.marker([lat, lng], { icon: userIcon })
              .addTo(map)
              .bindPopup('<b>Vị trí của bạn (thủ công)</b>')
              .openPopup();
      }

      map.setView([lat, lng], 15);
      closeLocationInputModal();

      alert('Đã cập nhật vị trí thủ công thành công!');

      // Load nearby fields
      loadNearbyFields(lat, lng);
  }

  // Add manual location button to UI (you may want to add this to your HTML)
  function addManualLocationButton() {
      const container = document.querySelector('.search-container') || document.querySelector('.controls');
      if (container && !document.getElementById('manualLocationButton')) {
          const button = document.createElement('button');
          button.id = 'manualLocationButton';
          button.innerHTML = '<i class="fas fa-edit"></i> Nhập vị trí';
          button.className = 'btn btn-secondary';
          button.onclick = showManualLocationInput;
          button.style.marginLeft = '10px';

          container.appendChild(button);
      }
  }

  // Make functions globally available
  window.closeLocationHelpModal = closeLocationHelpModal;
  window.tryLocationAgain = tryLocationAgain;
  window.closeLocationInputModal = closeLocationInputModal;
  window.showManualLocationInput = showManualLocationInput;

  // --- Tải tất cả sân bóng từ API ---
  async function loadAllFootballFields() {
      // Check if user is logged in
      if (!currentUser) {
          if (searchResults) {
              searchResults.innerHTML = '<p>Vui lòng đăng nhập để xem danh sách sân bóng.</p>';
          }
          return;
      }

      // Clear previous data
      if (routePolyline) {
          map.removeLayer(routePolyline);
          routePolyline = null;
      }
      if (searchLocationMarker) {
          map.removeLayer(searchLocationMarker);
          searchLocationMarker = null;
      }

      if (searchResults) {
          searchResults.innerHTML = '<div class="loading">Đang tải</div>';
      }

      try {
          const data = await fetchAPI('fields');
          if (data && data.length > 0) {
              displayFootballFields(data);
          } else {
              if (searchResults) {
                  searchResults.innerHTML = '<p class="no-results">Không tìm thấy sân bóng nào.</p>';
              }
          }
      } catch (error) {
          console.error('Error loading fields:', error);
          if (searchResults) {
              searchResults.innerHTML = '<p class="error-message">Lỗi khi tải dữ liệu. Vui lòng thử lại.</p>';
          }
      }
  }

  // --- Hiển thị sân bóng trên bản đồ và sidebar ---
  function displayFootballFields(fieldsData) {
      currentMarkers.clearLayers(); // Xóa các marker sân bóng cũ

      // Xóa đường đi và marker tìm kiếm cũ (giữ lại marker vị trí người dùng)
      if (routePolyline) {
          map.removeLayer(routePolyline);
          routePolyline = null;
      }
      if (searchLocationMarker) {
          map.removeLayer(searchLocationMarker);
          searchLocationMarker = null;
      }

      if (searchResults) {
          searchResults.innerHTML = ''; // Xóa kết quả tìm kiếm cũ
      }

      const activeItems = document.querySelectorAll('.field-item.active');
      activeItems.forEach(item => item.classList.remove('active'));

      if (!fieldsData || fieldsData.length === 0) {
          if (searchResults) {
              searchResults.innerHTML = '<p class="no-results">Không tìm thấy sân bóng nào.</p>';
          }
          return;
      }

      fieldsData.forEach(field => {
          let lat, lon, fieldProps;

          // Check if it's API format or mock format
          if (field.latitude && field.longitude) {
              // API format
              lat = parseFloat(field.latitude);
              lon = parseFloat(field.longitude);

              // Handle images - could be string, array, or null
              let imageUrl = null;
              if (field.images) {
                if (Array.isArray(field.images) && field.images.length > 0) {
                    imageUrl = field.images[0];
                } else if (typeof field.images === 'string') {
                    imageUrl = field.images;
                }
              }

              // Format opening hours
              let openingHours = '06:00 - 22:00'; // default
              if (field.opening_hours) {
                  if (typeof field.opening_hours === 'object') {
                      // Take first available day's hours as example
                      const days = Object.keys(field.opening_hours);
                      if (days.length > 0) {
                          openingHours = field.opening_hours[days[0]] || openingHours;
                      }
                  } else if (typeof field.opening_hours === 'string') {
                      openingHours = field.opening_hours;
                  }
              }

              fieldProps = {
                  name: field.name || 'Sân bóng',
                  address: field.address || 'Chưa có địa chỉ',
                  price: field.price_per_hour ? `${parseFloat(field.price_per_hour).toLocaleString('vi-VN')} VND/giờ` : 'Liên hệ',
                  opening_hour: openingHours,
                  images: imageUrl
              };
          } else {
              // GeoJSON format
              lat = field.geometry.coordinates[1];
              lon = field.geometry.coordinates[0];
              fieldProps = field.properties;
          }

          const marker = L.marker([lat, lon], { icon: fieldIcon }).addTo(currentMarkers);

          // Tạo nội dung popup với hình ảnh được tối ưu
          const popupContent = `
              <div class="popup-content">
                  <b style="font-size: 16px; color: #2c3e50;">${fieldProps.name}</b><br>
                  <div style="margin: 8px 0;">
                      <i class="fas fa-map-marker-alt" style="color: #e74c3c;"></i>
                      <span style="margin-left: 5px;">${fieldProps.address}</span>
                  </div>
                  <div style="margin: 8px 0;">
                      <i class="fas fa-dollar-sign" style="color: #27ae60;"></i>
                      <span style="margin-left: 5px;">Giá: ${fieldProps.price}</span>
                  </div>
                  <div style="margin: 8px 0;">
                      <i class="fas fa-clock" style="color: #3498db;"></i>
                      <span style="margin-left: 5px;">Giờ mở cửa: ${fieldProps.opening_hour}</span>
                  </div>
                  ${fieldProps.images ? `
                      <div style="margin-top: 10px; text-align: center;">
                          <img src="${fieldProps.images}"
                               alt="Ảnh sân ${fieldProps.name}"
                               style="width: 150px; max-height: 120px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer;"
                               onclick="showImageModal('${fieldProps.images.replace(/'/g, "\\'")}', '${fieldProps.name.replace(/'/g, "\\'")}')">
                          <br><small style="color: #7f8c8d;">Nhấn vào ảnh để xem lớn hơn</small>
                      </div>
                  ` : '<div style="margin-top: 10px; text-align: center; color: #95a5a6;"><i class="fas fa-image"></i> Không có hình ảnh</div>'}
              </div>
          `;
          marker.bindPopup(popupContent, {
              maxWidth: 250,
              minWidth: 200
          });

          // Thêm vào sidebar
          if (searchResults) {
              const fieldItem = document.createElement('div');
              fieldItem.className = 'field-item';
              fieldItem.innerHTML = `
                  ${fieldProps.images ? `<img src="${fieldProps.images}" alt="Ảnh sân" class="field-item-image" onclick="showImageModal('${fieldProps.images.replace(/'/g, "\\'")}', '${fieldProps.name.replace(/'/g, "\\'")}')">` : '<div class="field-item-no-image"><i class="fas fa-image"></i></div>'}
                  <div class="field-details">
                      <h3>${fieldProps.name}</h3>
                      <p><i class="fas fa-map-marker-alt"></i> ${fieldProps.address}</p>
                      <p><i class="fas fa-dollar-sign"></i> Giá: ${fieldProps.price}</p>
                      <p><i class="fas fa-clock"></i> Giờ mở cửa: ${fieldProps.opening_hour}</p>
                      <button class="get-directions-btn" data-lat="${lat}" data-lon="${lon}">
                          <i class="fas fa-directions"></i> Chỉ đường
                      </button>
                  </div>
              `;

              fieldItem.addEventListener('click', (e) => {
                  // Tránh kích hoạt khi nhấn vào hình ảnh hoặc button
                  if (e.target.tagName === 'IMG' || e.target.closest('button')) return;

                  const activeItems = document.querySelectorAll('.field-item.active');
                  activeItems.forEach(item => item.classList.remove('active'));
                  fieldItem.classList.add('active');

                  map.setView([lat, lon], 16);
                  marker.openPopup();
              });

              // Directions button event
              const directionsButton = fieldItem.querySelector('.get-directions-btn');
              directionsButton.addEventListener('click', async (e) => {
                  e.stopPropagation();

                  if (!userCurrentLocation) {
                      alert('Vui lòng định vị vị trí của bạn trước khi chỉ đường. Nhấn nút "Vị trí của tôi" bên trên.');
                      getUserLocation();
                      return;
                  }

                  const targetLat = parseFloat(directionsButton.dataset.lat);
                  const targetLon = parseFloat(directionsButton.dataset.lon);

                  // Clear previous route
                  currentMarkers.clearLayers();
                  if (routePolyline) {
                      map.removeLayer(routePolyline);
                      routePolyline = null;
                  }
                  if (searchLocationMarker) {
                      map.removeLayer(searchLocationMarker);
                      searchLocationMarker = null;
                  }
                  if (userLocationMarker) {
                      userLocationMarker.addTo(map);
                  }

                  // Mock route calculation (replace with real routing API)
                  const distance = map.distance([userCurrentLocation.lat, userCurrentLocation.lon], [targetLat, targetLon]);
                  const estimatedTime = Math.round(distance / 1000 * 5); // Assuming 5 minutes per km

                  // Create simple straight line route (replace with real routing)
                  const latlngs = [
                      [userCurrentLocation.lat, userCurrentLocation.lon],
                      [targetLat, targetLon]
                  ];

                  routePolyline = L.polyline(latlngs, { color: '#4CAF50', weight: 6, opacity: 0.8 }).addTo(map);

                  const fieldName = directionsButton.closest('.field-item').querySelector('h3').innerText;

                  L.marker([targetLat, targetLon], { icon: endPointIcon })
                    .addTo(map)
                    .bindPopup(`<b>${fieldName}</b>`)
                    .openPopup();

                  map.fitBounds(routePolyline.getBounds().pad(0.1));

                  alert(`Đã tìm thấy tuyến đường! Khoảng cách: ${(distance / 1000).toFixed(2)} km, Thời gian ước tính: ${estimatedTime} phút.`);
              });

              searchResults.appendChild(fieldItem);
          }
      });

      if (fieldsData.length > 0 && !routePolyline) {
          map.fitBounds(currentMarkers.getBounds().pad(0.1));
      }
  }

  // Hàm hiển thị modal hình ảnh
  function showImageModal(imageUrl, fieldName) {
      // Tạo modal nếu chưa tồn tại
      let modal = document.getElementById('imageModal');
      if (!modal) {
          modal = document.createElement('div');
          modal.id = 'imageModal';
          modal.innerHTML = `
              <div class="modal-backdrop" onclick="closeImageModal()">
                  <div class="modal-content" onclick="event.stopPropagation()">
                      <span class="close-button" onclick="closeImageModal()">&times;</span>
                      <img id="modalImage" src="" alt="" style="max-width: 100%; max-height: 80vh; border-radius: 8px;">
                      <div class="modal-caption" id="modalCaption"></div>
                  </div>
              </div>
          `;

          // Add CSS styles directly if not in external CSS
          modal.style.cssText = `
              display: none;
              position: fixed;
              z-index: 10000;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
          `;

          const backdrop = modal.querySelector('.modal-backdrop');
          backdrop.style.cssText = `
              background-color: rgba(0, 0, 0, 0.8);
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              cursor: pointer;
          `;

          const content = modal.querySelector('.modal-content');
          content.style.cssText = `
              position: relative;
              max-width: 90%;
              max-height: 90%;
              cursor: default;
          `;

          const closeBtn = modal.querySelector('.close-button');
          closeBtn.style.cssText = `
              position: absolute;
              top: -40px;
              right: 0;
              color: white;
              font-size: 30px;
              font-weight: bold;
              cursor: pointer;
              z-index: 10001;
          `;

          const caption = modal.querySelector('.modal-caption');
          caption.style.cssText = `
              color: white;
              text-align: center;
              padding: 10px;
              font-size: 16px;
              font-weight: bold;
          `;

          document.body.appendChild(modal);
      }

      // Hiển thị hình ảnh trong modal
      const modalImage = document.getElementById('modalImage');
      const modalCaption = document.getElementById('modalCaption');

      modalImage.src = imageUrl;
      modalImage.alt = `Ảnh sân ${fieldName}`;
      modalCaption.textContent = fieldName;

      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';

      // Add loading state
      modalImage.onload = function () {
          console.log('Image loaded successfully');
      };

      modalImage.onerror = function () {
          console.error('Failed to load image:', imageUrl);
          modalImage.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
      };
  }

  // Hàm đóng modal hình ảnh
  function closeImageModal() {
      const modal = document.getElementById('imageModal');
      if (modal) {
          modal.style.display = 'none';
          document.body.style.overflow = 'auto';
      }
  }

  // Clear map and results
  function clearMapAndResults() {
      currentMarkers.clearLayers();
      if (routePolyline) {
          map.removeLayer(routePolyline);
          routePolyline = null;
      }
      if (searchLocationMarker) {
          map.removeLayer(searchLocationMarker);
          searchLocationMarker = null;
      }
      if (userLocationMarker) {
          map.removeLayer(userLocationMarker);
          userLocationMarker = null;
      }
      userCurrentLocation = null;

      if (searchResults) {
          searchResults.innerHTML = '<div class="loading">Đang tải</div>';
      }
  }

  // --- Xử lý sự kiện tìm kiếm ---
  async function handleSearch() {
      if (!currentUser) {
          alert('Vui lòng đăng nhập để sử dụng chức năng tìm kiếm.');
          showLoginModal();
          return;
      }

      const searchTerm = searchInput ? searchInput.value.trim() : '';
      if (!searchTerm) {
          alert('Vui lòng nhập địa chỉ hoặc tên sân để tìm kiếm.');
          return;
      }

      // Clear previous data
      if (routePolyline) {
          map.removeLayer(routePolyline);
          routePolyline = null;
      }
      if (searchLocationMarker) {
          map.removeLayer(searchLocationMarker);
          searchLocationMarker = null;
      }

      if (searchResults) {
          searchResults.innerHTML = '<div class="loading">Đang tìm kiếm</div>';
      }

      try {
          const searchResultsData = await fetchAPI(`fields?search=${encodeURIComponent(searchTerm)}`);

          if (searchResultsData && searchResultsData.length > 0) {
              displayFootballFields(searchResultsData);
          } else {
              if (searchResults) {
                  searchResults.innerHTML = '<p class="no-results">Không tìm thấy sân bóng nào phù hợp với từ khóa tìm kiếm.</p>';
              }
          }
      } catch (error) {
          console.error('Search error:', error);
          if (searchResults) {
              searchResults.innerHTML = '<p class="error-message">Lỗi khi tìm kiếm. Vui lòng thử lại.</p>';
          }
      }
  }

  // --- EVENT LISTENERS ---
  if (loginButton) {
      loginButton.addEventListener('click', showLoginModal);
  }
  if (logoutButton) {
      logoutButton.addEventListener('click', handleLogout);
  }
  if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
  }
  if (registerForm) {
      registerForm.addEventListener('submit', handleRegister);
  }
  if (searchButton) {
      searchButton.addEventListener('click', handleSearch);
  }
  if (showAllFieldsButton) {
      showAllFieldsButton.addEventListener('click', loadAllFootballFields);
  }
  if (locateMeButton) {
      locateMeButton.addEventListener('click', getUserLocation);
  }

  // Search on Enter key
  if (searchInput) {
      searchInput.addEventListener('keypress', function (e) {
          if (e.key === 'Enter') {
              handleSearch();
          }
      });
  }

  // Close modals when clicking outside
  window.addEventListener('click', (event) => {
      if (event.target === loginModal) {
          closeLoginModal();
      }
      if (event.target === registerModal) {
          closeRegisterModal();
      }
  });

  // Close modals with Escape key
  document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
          if (loginModal && loginModal.style.display === 'block') {
              closeLoginModal();
          }
          if (registerModal && registerModal.style.display === 'block') {
              closeRegisterModal();
          }
          closeImageModal();
      }
  });

  // Close modal buttons
  document.querySelectorAll(".close").forEach(function (closeButton) {
      closeButton.addEventListener("click", function () {
          closeLoginModal();
          closeRegisterModal();
      });
  });

  // Make functions globally available for onclick handlers
  window.showRegisterForm = showRegisterForm;
  window.showLoginForm = showLoginForm;
  window.closeLoginModal = closeLoginModal;
  window.closeRegisterModal = closeRegisterModal;
  window.showImageModal = showImageModal;
  window.closeImageModal = closeImageModal;

  // Check for stored authentication and load initial data
  const isAuthenticated = checkStoredAuth();
  if (isAuthenticated) {
      loadAllFootballFields();
  } else {
      if (searchResults) {
          searchResults.innerHTML = '<p>Vui lòng đăng nhập để xem danh sách sân bóng.</p>';
      }
  }

  console.log('Application initialized successfully');

  // Initialize manual location button when page loads
  setTimeout(addManualLocationButton, 1000);
});
