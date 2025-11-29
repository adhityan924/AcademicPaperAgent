document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadLoader = document.getElementById('uploadLoader');
    const uploadStatus = document.getElementById('uploadStatus');
    const paperList = document.getElementById('paperList');
    const refreshBtn = document.getElementById('refreshBtn');
    const fileInput = document.querySelector('.file-input');
    const fileMsg = document.querySelector('.file-msg');

    // File input drag/drop visual feedback
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            fileMsg.textContent = fileInput.files[0].name;
        }
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileInput.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    fileInput.addEventListener('dragenter', () => fileInput.parentElement.classList.add('is-active'));
    fileInput.addEventListener('dragleave', () => fileInput.parentElement.classList.remove('is-active'));
    fileInput.addEventListener('drop', () => fileInput.parentElement.classList.remove('is-active'));


    // Initialize Cytoscape
    let cy = cytoscape({
        container: document.getElementById('cy'),
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#38bdf8',
                    'label': 'data(label)',
                    'color': '#94a3b8',
                    'font-size': '12px',
                    'text-valign': 'bottom',
                    'text-margin-y': 5
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#334155',
                    'target-arrow-color': '#334155',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '10px',
                    'color': '#64748b',
                    'text-rotation': 'autorotate'
                }
            }
        ],
        layout: {
            name: 'cose',
            animate: true
        }
    });

    // Tab Handling
    const tabs = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    function populateTextView(data) {
        const nodesBody = document.getElementById('nodesBody');
        const edgesBody = document.getElementById('edgesBody');

        // Clear existing data
        nodesBody.innerHTML = '';
        edgesBody.innerHTML = '';

        // Populate Nodes
        const nodes = data.elements.filter(el => !el.data.source);
        nodes.forEach(node => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${node.data.label}</td>
                <td><span class="badge badge-blue">${node.data.type}</span></td>
                <td>${JSON.stringify(node.data.properties || {})}</td>
            `;
            nodesBody.appendChild(tr);
        });

        // Populate Edges
        const edges = data.elements.filter(el => el.data.source);
        edges.forEach(edge => {
            const tr = document.createElement('tr');
            // Find source and target labels for better readability
            const sourceNode = nodes.find(n => n.data.id === edge.data.source);
            const targetNode = nodes.find(n => n.data.id === edge.data.target);

            tr.innerHTML = `
                <td>${sourceNode ? sourceNode.data.label : edge.data.source}</td>
                <td>${targetNode ? targetNode.data.label : edge.data.target}</td>
                <td><span class="badge badge-purple">${edge.data.label}</span></td>
                <td>${JSON.stringify(edge.data.properties || {})}</td>
            `;
            edgesBody.appendChild(tr);
        });
    }

    // Fetch and render graph
    async function loadGraph(paperSource = null) {
        try {
            let url = '/api/graph';
            if (paperSource) {
                url += `?paper=${encodeURIComponent(paperSource)}`;
            }

            const response = await fetch(url);
            const data = await response.json();

            cy.elements().remove();
            cy.add(data.elements);
            cy.layout({ name: 'cose', animate: true }).run();

            // Populate text view
            populateTextView(data);
        } catch (error) {
            console.error('Error loading graph:', error);
        }
    }

    // Fetch and render papers
    async function loadPapers() {
        try {
            const response = await fetch('/api/papers');
            const papers = await response.json();

            paperList.innerHTML = '';
            if (papers.length === 0) {
                paperList.innerHTML = '<li style="justify-content: center; color: var(--text-tertiary);">No papers found</li>';
            }
            papers.forEach(paper => {
                const li = document.createElement('li');
                li.textContent = paper.source;
                li.style.cursor = 'pointer';
                li.title = 'Click to filter graph';

                li.addEventListener('click', () => {
                    // Highlight selected paper
                    document.querySelectorAll('.paper-list li').forEach(el => el.classList.remove('selected'));
                    li.classList.add('selected');

                    // Load graph for this paper
                    loadGraph(paper.source);
                });

                paperList.appendChild(li);
            });
        } catch (error) {
            console.error('Error loading papers:', error);
        }
    }

    // Handle Upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(uploadForm);

        uploadBtn.disabled = true;
        uploadLoader.style.display = 'block';
        uploadStatus.textContent = 'Uploading and processing...';
        uploadStatus.className = 'status-msg';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                uploadStatus.textContent = 'Success! Paper is being processed in the background.';
                uploadStatus.classList.add('status-success');
                uploadForm.reset();
                fileMsg.textContent = 'or drag and drop here';

                // Poll for updates every 5 seconds
                const pollInterval = setInterval(() => {
                    loadPapers();
                    loadGraph();
                }, 5000);

                // Stop polling after 2 minutes (assuming processing should be done by then)
                setTimeout(() => {
                    clearInterval(pollInterval);
                    uploadStatus.textContent = 'Processing check complete. If your paper is not visible, please try refreshing manually.';
                }, 120000);
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            uploadStatus.textContent = `Error: ${error.message}. Check console for details.`;
            uploadStatus.classList.add('status-error');
        } finally {
            uploadBtn.disabled = false;
            uploadLoader.style.display = 'none';
        }
    });

    refreshBtn.addEventListener('click', loadGraph);

    // Initial load
    loadGraph();
    loadPapers();
});
