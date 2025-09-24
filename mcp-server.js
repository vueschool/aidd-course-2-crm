#!/usr/bin/env node

import http from 'http';

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end();
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const request = JSON.parse(body);

      // Handle JSON-RPC 2.0 requests
      if (request.method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '0.1.0',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'aidd-crm-mcp',
              version: '1.0.0'
            }
          }
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      }
      else if (request.method === 'tools/list') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: [
              {
                name: 'search_customers',
                description: 'Search for customers by name, website, or industry',
                inputSchema: {
                  type: 'object',
                  properties: {
                    str: {
                      type: 'string',
                      description: 'Search string'
                    }
                  },
                  required: ['str']
                }
              },
              {
                name: 'get_customer_profile',
                description: 'Get detailed customer information',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Customer ID'
                    }
                  },
                  required: ['id']
                }
              },
              {
                name: 'change_customer_plan',
                description: 'Change customer subscription plan',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Customer ID'
                    },
                    newPlan: {
                      type: 'string',
                      enum: ['Basic', 'Pro', 'Enterprise'],
                      description: 'New plan'
                    }
                  },
                  required: ['id', 'newPlan']
                }
              },
              {
                name: 'credit_account',
                description: 'Add credits to customer account',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Customer ID'
                    },
                    amountCents: {
                      type: 'number',
                      description: 'Amount in cents'
                    },
                    reason: {
                      type: 'string',
                      description: 'Reason for credit'
                    }
                  },
                  required: ['id', 'amountCents', 'reason']
                }
              },
              {
                name: 'send_email_to_customer',
                description: 'Send email to customer primary contact',
                inputSchema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      description: 'Customer ID'
                    }
                  },
                  required: ['id']
                }
              }
            ]
          }
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      }
      else if (request.method === 'tools/call') {
        // Forward to our existing API
        const toolName = request.params.name;
        const toolArgs = request.params.arguments;

        const apiRequest = await fetch('http://localhost:3000/api/mcp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: toolName,
            params: toolArgs
          })
        });

        const apiResult = await apiRequest.json();

        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(apiResult, null, 2)
              }
            ]
          }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      }
      else {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      }
    } catch (error) {
      const response = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error',
          data: error.message
        }
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(response));
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('To connect with MCP Inspector:');
  console.log(`1. Go to http://localhost:6274/?MCP_PROXY_AUTH_TOKEN=<your-token>`);
  console.log(`2. Use connection string: http://localhost:${PORT}`);
  console.log('3. Select "SSE" as the transport type');
});