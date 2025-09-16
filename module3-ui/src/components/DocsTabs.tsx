import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, Card, CardContent, Chip, Stack } from '@mui/material';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function DocsTabs() {
  const [value, setValue] = useState(0);

  return (
    <Card variant="outlined" sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h3" sx={{ mb: 1, fontSize: '1.25rem' }}>Developer Docs</Typography>
        <Tabs value={value} onChange={(_,v)=>setValue(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="REST API" />
          <Tab label="SDK" />
          <Tab label="On-chain" />
          <Tab label="Integration" />
        </Tabs>
        <TabPanel value={value} index={0}>
          <Typography gutterBottom>Use CredChain's cross-subnet identity verification in your apps.</Typography>
          <Stack direction="row" spacing={1} sx={{ mb:2 }}>
            <Chip label="Identity" color="primary" size="small" />
            <Chip label="Relayer" color="secondary" size="small" />
            <Chip label="Attestations" color="success" size="small" />
          </Stack>
          <Typography variant="subtitle2" sx={{ mt:2 }}>Flow</Typography>
          <Typography component="pre" sx={{ p:2, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:1, fontSize:13, overflow:'auto' }}>{`Employee -> Sign Payload -> Relayer Submit -> ICM Messages -> Subnet Attestors -> Identity Registry`}</Typography>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Typography gutterBottom>Base URL: <code>http://localhost:4000</code></Typography>
          <Typography variant="h4" sx={{fontSize:'1rem', mt:2}}>Relayer Endpoints</Typography>
          <Typography component="pre" sx={{ p:2, mt:1, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:1, fontSize:12 }}>{`POST /v1/relayer/submit\n  Body: { messageHash, signature, meta:{ destChainId, attestationLevel, nonce, userAddress, hrTicketId? } }\n  => { jobId }\nGET  /v1/relayer/status/:jobId => { jobId, status, txHash }\nGET  /v1/relayer/job/:jobId    => { jobId, job }\nGET  /v1/relayer/list          => { jobs }\nGET  /v1/relayer/events (SSE)  => data: { type, jobId, status, meta, txHash }\nPOST /v1/relayer/debug/recover => signature recovery attempts\nPOST /v1/relayer/reverify/:jobId\nPOST /v1/relayer/create-fake   => simulate job`}</Typography>
          <Typography variant="h4" sx={{fontSize:'1rem', mt:3}}>HR Workflow</Typography>
          <Typography component="pre" sx={{ p:2, mt:1, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:1, fontSize:12 }}>{`GET  /api/hr/users\nPOST /api/hr/register { userAddress, jurisdiction, ipfsCid }\nPOST /api/hr/attest { userAddress, level, metadataCid }\nPOST /api/hr/crosschain/request { destChainId, userAddress, requestedLevel }\nPOST /api/hr/verification/create { hrRequestId, employeeId, employeeName, employeeEmail, verificationTypes? }\nGET  /api/hr/verification/status/:hrRequestId\nGET  /api/hr/verification/ticket/:ticketId\nPOST /api/hr/verification/complete/:ticketId { success, signature, signedPayload, verifiedAddress }\nGET  /api/hr/verification/list`}</Typography>
          <Typography variant="h4" sx={{fontSize:'1rem', mt:3}}>Contracts & Teleporter</Typography>
          <Typography component="pre" sx={{ p:2, mt:1, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:1, fontSize:12 }}>{`GET /api/contracts/abis\nPOST /api/teleporter/send { destChainId, user, attestationLevel }\nPOST /api/vault/upload (file|json) => { storage, cid|url }`}</Typography>
          <Typography variant="subtitle2" sx={{mt:3}}>Sample cURL</Typography>
          <Typography component="pre" sx={{ p:2, bgcolor:'grey.900', color:'grey.100', borderRadius:1, fontSize:12, overflow:'auto' }}>{`curl -X POST http://localhost:4000/v1/relayer/submit \\\n -H 'Content-Type: application/json' \\\n -d '{"messageHash":"0x..","signature":"0x..","meta":{"destChainId":1337001,"attestationLevel":1,"nonce":123,"userAddress":"0x..."}}'`}</Typography>
        </TabPanel>
        <TabPanel value={value} index={2}>
          <Typography variant="subtitle2">Sign & Submit</Typography>
          <Typography component="pre" sx={{ p:2, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:1, fontSize:13, overflow:'auto' }}>{`import { getProvider, signVerificationPayload, submitRelayerJob, pollJob } from './lib/sdk';\n\nconst provider = await getProvider();\nconst signer = await provider.getSigner();\nconst meta = { destChainId:1337001, attestationLevel:1, nonce:Date.now()/1000, userAddress: await signer.getAddress() };\nconst signed = await signVerificationPayload(signer, meta);\nconst { jobId } = await submitRelayerJob(signed);\nawait pollJob(jobId, s => console.log('status', s));`}</Typography>
        </TabPanel>
        <TabPanel value={value} index={3}>
          <Typography variant="subtitle2">Contracts</Typography>
          <Typography component="pre" sx={{ p:2, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:1, fontSize:13, overflow:'auto' }}>{`IdentityRegistry.sol\nVerificationAttestor.sol\nCrossChainRouter.sol`}</Typography>
          <Typography variant="subtitle2" sx={{ mt:2 }}>Reputation Oracle</Typography>
          <Typography component="pre" sx={{ p:2, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:1, fontSize:12 }}>{`ReputationOracle.sol\n- increaseReputation(address,uint256) (UPDATER_ROLE)\n- getReputation(address) view returns (uint256)`}</Typography>
        </TabPanel>
        <TabPanel value={value} index={4}>
          <Typography variant="h4" sx={{fontSize:'1rem'}}>Integrating with Existing HRIS</Typography>
          <Typography sx={{ mt:1 }}>Treat CredChain as a credential & trust microservice:</Typography>
          <ul style={{marginTop:8}}>
            <li><strong>Create Ticket</strong>: <code>POST /api/hr/verification/create</code></li>
            <li><strong>Notify Employee</strong>: send <code>verificationUrl</code></li>
            <li><strong>Employee Signs</strong>: wallet signature -&gt; relayer job</li>
            <li><strong>Monitor</strong>: poll <code>/api/hr/verification/status/:hrRequestId</code> or subscribe to SSE</li>
            <li><strong>Finalize</strong>: mark internal profile verified; store attestation level</li>
            <li><strong>Enhance</strong>: (future) reputation score for risk scoring</li>
          </ul>
          <Typography variant="subtitle2" sx={{ mt:2 }}>Minimal Integration (Pseudo)</Typography>
          <Typography component="pre" sx={{ p:2, bgcolor:'grey.50', border:'1px solid', borderColor:'divider', borderRadius:1, fontSize:12 }}>{`// Create\nconst create = await fetch(api+'/api/hr/verification/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hrRequestId:'HR123',employeeId:'E42',employeeName:'Alice',employeeEmail:'alice@corp.com'})}).then(r=>r.json());\n// Poll\nlet s; do { s = await fetch(api+'/api/hr/verification/status/HR123').then(r=>r.json()); await new Promise(r=>setTimeout(r,3000)); } while(s.status!=='verified');\n// Done`}</Typography>
          <Typography variant="subtitle2" sx={{ mt:2 }}>Security Notes</Typography>
          <ul>
            <li>Rate limit ticket creation</li>
            <li>Validate recovered address matches expected employee wallet</li>
            <li>Store minimal PII; offload docs to vault (IPFS/Pinata)</li>
          </ul>
        </TabPanel>
      </CardContent>
    </Card>
  );
}
